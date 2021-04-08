import cv2
import glob
from joblib import Parallel, delayed
import uuid
import json
import os


def cutImages(path: str, basePath):
    if(not path.endswith(".jpg")):
        return
    targetPath = "/home/alextay96/Desktop/Merimen_workspace/transferport/mrm_computer_vision/data/interim/metassl"
    img = cv2.imread(os.path.join(basePath, path))
    os.makedirs(targetPath, exist_ok=True)
    size = 240
    for r in range(0, img.shape[0], size):
        for c in range(0, img.shape[1], size):
            cv2.imwrite("{0}/{3}_img{1}_{2}.png".format(targetPath,
                                                        r, c, uuid.uuid4().hex), img[r:r+size, c:c+size, :])


if __name__ == '__main__':
    basePath = "/home/alextay96/Desktop/Merimen_workspace/transferport/mrm_computer_vision/data/interim/coco_raw"
    Parallel(n_jobs=1)(delayed(cutImages)(path, basePath)
                       for path in glob.iglob(basePath + '**/**', recursive=True))
