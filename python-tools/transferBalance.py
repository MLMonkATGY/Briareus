import cv2
import glob
from joblib import Parallel, delayed
import uuid
import shutil
import os
import random


def cutImages(path: str, targetBasePath):
    if(not os.path.isdir(path)):
        return
    if("test" in path):
        return
    print(path)
    allSampleInClass = os.listdir(path)
    random.shuffle(allSampleInClass)

    classDir = path.split("/")[-1]
    targetPath = os.path.join(targetBasePath, classDir)
    dataToMove = allSampleInClass[:200]
    os.makedirs(targetPath, exist_ok=True)
    for imgs in dataToMove:
        sourceFullPath = os.path.join(path, imgs)

        shutil.copy(sourceFullPath, "{0}/images{1}.png".format(targetPath,
                                                               uuid.uuid4().hex))


if __name__ == '__main__':
    basePath = "/home/alextay96/Desktop/Merimen_workspace/transferport/mrm_computer_vision/data/interim/damaged_components"
    targetBasePath = "/home/alextay96/Desktop/Merimen_workspace/transferport/mrm_computer_vision/data/interim/damaged_components_balanced"
    os.makedirs(targetBasePath, exist_ok=True)
    Parallel(n_jobs=-1)(delayed(cutImages)(path, targetBasePath)
                        for path in glob.iglob(basePath + '**/*', recursive=False))
