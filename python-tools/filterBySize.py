import cv2
import glob
from joblib import Parallel, delayed
import uuid
import shutil
import os
import random
from PIL import Image


def cutImages(path: str, targetBasePath):
    if(".jpg" not in (path)):
        return
    k = Image.open(path)
    width, height = k.size
    if(width * height < (250*250)):
        shutil.copy(path, "{0}/images{1}.png".format(targetBasePath,
                                                     uuid.uuid4().hex))


if __name__ == '__main__':
    basePath = "/home/alextay96/Desktop/Merimen_workspace/transferport/mrm_computer_vision/data/interim/Metadata_temp"
    targetBasePath = "/home/alextay96/Desktop/Merimen_workspace/transferport/mrm_computer_vision/data/interim/filterBySize"
    os.makedirs(targetBasePath, exist_ok=True)
    Parallel(n_jobs=-1)(delayed(cutImages)(path, targetBasePath)
                        for path in glob.iglob(basePath + '**/**', recursive=True))
