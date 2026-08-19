-- Run after schema.sql in Supabase SQL Editor.

create or replace function public.create_marketplace_order(p_user_id bigint,p_payment_method text)
returns setof public.orders
language plpgsql security definer set search_path=public as $$
declare v_cart bigint;v_currency text;v_subtotal bigint;v_order_id bigint;v_number text;
begin
 select id into v_cart from carts where user_id=p_user_id for update;
 if v_cart is null or not exists(select 1 from cart_items where cart_id=v_cart) then raise exception 'EMPTY_CART';end if;
 if exists(select 1 from cart_items ci join products p on p.id=ci.product_id where ci.cart_id=v_cart and p.status<>'published') then raise exception 'UNAVAILABLE_PRODUCT';end if;
 if exists(select 1 from cart_items ci join products p on p.id=ci.product_id where ci.cart_id=v_cart and p.product_type in('digital','software','creative','course') and not exists(select 1 from digital_files f where f.product_id=p.id and f.is_active)) then raise exception 'DIGITAL_FILE_REQUIRED';end if;
 select min(p.currency),sum(p.price_cents*ci.quantity) into v_currency,v_subtotal from cart_items ci join products p on p.id=ci.product_id where ci.cart_id=v_cart;
 if (select count(distinct p.currency) from cart_items ci join products p on p.id=ci.product_id where ci.cart_id=v_cart)>1 then raise exception 'MIXED_CURRENCY_CART';end if;
 if p_payment_method='cash_on_delivery' and exists(select 1 from cart_items ci join products p on p.id=ci.product_id where ci.cart_id=v_cart and p.product_type<>'physical') then raise exception 'COD_NOT_ALLOWED';end if;
 v_number:='ZM-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(md5(random()::text||clock_timestamp()::text),1,8));
 insert into orders(order_number,user_id,currency,subtotal_cents,total_cents,payment_method) values(v_number,p_user_id,v_currency,v_subtotal,v_subtotal,p_payment_method) returning id into v_order_id;
 insert into order_items(order_id,product_id,seller_id,title,unit_price_cents,quantity,product_type) select v_order_id,p.id,p.seller_id,p.title_ar,p.price_cents,case when p.product_type='physical' then ci.quantity else 1 end,p.product_type from cart_items ci join products p on p.id=ci.product_id where ci.cart_id=v_cart;
 delete from cart_items where cart_id=v_cart;
 insert into audit_log(actor_id,action,entity_type,entity_id,metadata) values(p_user_id,'order.create','order',v_order_id,jsonb_build_object('orderNumber',v_number,'totalCents',v_subtotal));
 return query select * from orders where id=v_order_id;
end$$;

create or replace function public.update_marketplace_order_status(p_order_id bigint,p_actor_id bigint,p_new_status text)
returns setof public.orders
language plpgsql security definer set search_path=public as $$
declare v_old text;
begin
 select status into v_old from orders where id=p_order_id for update;if v_old is null then raise exception 'ORDER_NOT_FOUND';end if;
 if p_new_status<>v_old and not ((v_old='pending_payment' and p_new_status in('paid','cancelled'))or(v_old='paid' and p_new_status in('processing','refunded'))or(v_old='processing' and p_new_status in('completed','cancelled','refunded'))or(v_old='completed' and p_new_status='refunded')) then raise exception 'INVALID_ORDER_TRANSITION';end if;
 update orders set status=p_new_status,updated_at=now() where id=p_order_id;
 if p_new_status='paid' then insert into download_grants(order_item_id,user_id,product_id,max_downloads) select oi.id,o.user_id,oi.product_id,5 from order_items oi join orders o on o.id=oi.order_id where oi.order_id=p_order_id and oi.product_type in('digital','software','creative','course') and exists(select 1 from digital_files f where f.product_id=oi.product_id and f.is_active) on conflict(order_item_id) do nothing;end if;
 if p_new_status in('cancelled','refunded') then update download_grants set revoked_at=now() where order_item_id in(select id from order_items where order_id=p_order_id) and revoked_at is null;end if;
 insert into audit_log(actor_id,action,entity_type,entity_id,metadata) values(p_actor_id,'order.status.update','order',p_order_id,jsonb_build_object('from',v_old,'to',p_new_status));
 return query select * from orders where id=p_order_id;
end$$;

create or replace function public.consume_download_grant(p_grant_id bigint,p_user_id bigint,p_file_id bigint,p_ip text,p_user_agent text)
returns boolean language plpgsql security definer set search_path=public as $$
declare changed integer;
begin
 update download_grants set download_count=download_count+1 where id=p_grant_id and user_id=p_user_id and revoked_at is null and download_count<max_downloads and(expires_at is null or expires_at>now());get diagnostics changed=row_count;if changed<>1 then return false;end if;
 insert into download_log(grant_id,file_id,ip_address,user_agent) values(p_grant_id,p_file_id,left(p_ip,100),left(p_user_agent,300));
 insert into audit_log(actor_id,action,entity_type,entity_id,metadata) values(p_user_id,'digital_file.download','download_grant',p_grant_id,jsonb_build_object('fileId',p_file_id));return true;
end$$;

revoke all on function public.create_marketplace_order(bigint,text) from public,anon,authenticated;
revoke all on function public.update_marketplace_order_status(bigint,bigint,text) from public,anon,authenticated;
revoke all on function public.consume_download_grant(bigint,bigint,bigint,text,text) from public,anon,authenticated;
grant execute on function public.create_marketplace_order(bigint,text) to service_role;
grant execute on function public.update_marketplace_order_status(bigint,bigint,text) to service_role;
grant execute on function public.consume_download_grant(bigint,bigint,bigint,text,text) to service_role;
select 'Marketplace functions created successfully' as result;
