import os
import glob
import shutil
import uuid
if __name__ == '__main__':
    basePath = "/media/alextay96/Storage/classdata_train"
    targetDir = "/media/alextay96/Storage/frames_train"
    fps = 5
    for path in glob.iglob(basePath + '**/**', recursive=True):
        if(path.endswith("mp4")):
            classname = path.split("/")[-2]
            subdir = "v_{}_g01_c1".format(classname)
            imageDir = os.path.join(targetDir, classname, subdir)
            os.makedirs(imageDir, exist_ok=True)
            cmd = 'ffmpeg -i {0} -s 224x224 -vf fps={1}  {2}/image_%05d.jpg'.format(
                path, fps, imageDir)
            # cmd = "ffmpeg"
            stream = os.popen(cmd)
            output = stream.read()
            print(path)
