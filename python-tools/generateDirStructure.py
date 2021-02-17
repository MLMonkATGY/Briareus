import os
import glob
import shutil
import uuid
if __name__ == '__main__':
    basePath = "/media/alextay96/Storage/train"
    classDataPath = "/media/alextay96/Storage/classdata_train"
    for path in glob.iglob(basePath + '**/**', recursive=True):
        if(path.endswith("mp4")):
            filename = path.split("/")[-1]
            newClassDir = os.path.join(classDataPath, uuid.uuid4().hex)
            os.mkdir(newClassDir)
            shutil.move(path, os.path.join(newClassDir, filename))
