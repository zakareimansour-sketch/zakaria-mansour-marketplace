from pathlib import Path
from mutagen.mp3 import MP3
import imageio_ffmpeg, subprocess
root=Path(__file__).parent
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
clips=root/'clips';clips.mkdir(exist_ok=True)
parts=[]
for i in range(1,7):
 image=root/'slides'/f'{i:02}.png';audio=root/'audio'/(f'{i:02}-'+['intro','supabase','github','hosting','owner-test','summary'][i-1]+'.mp3')
 duration=MP3(audio).info.length+0.25
 output=clips/f'{i:02}.mp4'
 cmd=[ffmpeg,'-y','-loop','1','-i',str(image),'-i',str(audio),'-t',str(duration),'-vf','scale=1280:720,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','21','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',str(output)]
 subprocess.run(cmd,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 parts.append(output)
concat=root/'concat.txt';concat.write_text('\n'.join(f"file '{p.as_posix()}'" for p in parts))
final=root/'ZAKARIA_MANSOUR_SETUP_GUIDE.mp4'
subprocess.run([ffmpeg,'-y','-f','concat','-safe','0','-i',str(concat),'-c','copy','-movflags','+faststart',str(final)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
print(final)
