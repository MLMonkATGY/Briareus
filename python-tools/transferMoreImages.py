import cv2
import glob
from joblib import Parallel, delayed
import uuid
import shutil


def cutImages(path: str, basePath):
    if(not path.endswith(".png")):
        return

    shutil.copy(path, "{0}/images{1}.png".format(basePath,
                                                 uuid.uuid4().hex))


if __name__ == '__main__':
    basePath = "/home/alextay96/Desktop/Merimen_workspace/transferport/mrm_computer_vision/data/interim/components"
    classDataPath = "/home/alextay96/Desktop/Merimen_workspace/ssl/restrict"
    Parallel(n_jobs=-1)(delayed(cutImages)(path, classDataPath)
                        for path in glob.iglob(basePath + '**/**', recursive=True))
