import os
import glob
import shutil
import uuid
import random
if __name__ == '__main__':
    basePath = "/media/alextay96/Storage/train"
    classDataPath = "/media/alextay96/Storage/eval"
    c = 0
    for path in glob.iglob(basePath + '**/**', recursive=True):
        if(path.endswith("mp4")):
            c += 1
            if(random.random() < 0.4):
                filename = path.split("/")[-1]
                newClassDir = os.path.join(classDataPath, uuid.uuid4().hex)
                os.mkdir(newClassDir)
                shutil.move(path, os.path.join(newClassDir, filename))
                os.remove(path)
    print(c)
