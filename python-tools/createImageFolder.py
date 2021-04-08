import os
import glob
import shutil
import uuid
from joblib import Parallel, delayed


def move(path: str, targetPath: str):
    # print(path)
    if(not path.endswith("jpg")):
        return
    newClassDir = os.path.join(targetPath, uuid.uuid4().hex)
    os.makedirs(newClassDir, exist_ok=True)
    newDirPath = os.path.join(newClassDir,
                              "image.jpg")
    # shutil.copy()
    shutil.copy(path, newDirPath)


if __name__ == '__main__':
    basePath = "/media/alextay96/Storage/frame_train_2"
    targetPath = "/home/alextay96/Desktop/workspace/3d-eff/byol/byol-pytorch/breakdatasets"
    Parallel(n_jobs=-1)(delayed(move)(path, targetPath)
                        for path in glob.iglob(basePath + '**/**', recursive=True))
    # for path in glob.iglob(basePath + '**/*', recursive=False):
    #     print(path)
    #     classDirName = path.split("/")[-1]
    #     ucfTmpDir = "v_{0}_g01_c{1}".format(classDirName, 1)

    #     newDirPath = os.path.join(classDataPath, classDirName,
    #                               ucfTmpDir)
    #     # shutil.copy()
    #     shutil.copytree(path, newDirPath)

    #     if(path.endswith("mp4")):
    #         filename = path.split("/")[-1]
    #         newClassDir = os.path.join(classDataPath, uuid.uuid4().hex)
    #         os.mkdir(newClassDir)
    #         shutil.move(path, os.path.join(newClassDir, filename))
