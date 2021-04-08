import os
import glob
import shutil
import uuid
if __name__ == '__main__':
    basePath = "/media/alextay96/Storage/frame_train_2"
    targetDir = "/media/alextay96/Storage/frame_train_2"
    rejected = "/media/alextay96/Storage/rejected"
    a = os.listdir(targetDir)
    for dir in a:
        imgNum = 0
        for path in glob.iglob(os.path.join(targetDir, dir) + '**/**', recursive=True):
            if(path.endswith("jpg")):
                imgNum += 1
            # if(path.endswith("b5d7deaa464f43808ff095001f0ce059/")):
            #     print(path)
        if(imgNum < 16):
            print(dir)
            name = dir.split("/")[-1]
            shutil.move(os.path.join(targetDir, dir),
                        os.path.join(rejected, dir))
            # shutil.rmtree(os.path.join(targetDir, dir))
