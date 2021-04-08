import os
import glob
import shutil
import uuid
from joblib import Parallel, delayed


def move(path):
    print(path)
    classDirName = path.split("/")[-1]
    ucfTmpDir = "v_{0}_g01_c{1}".format(classDirName, 1)

    newDirPath = os.path.join(classDataPath, classDirName,
                              ucfTmpDir)
    # shutil.copy()
    shutil.copytree(path, newDirPath)


if __name__ == '__main__':
    basePath = "/media/alextay96/Storage/unzipOutput/mnt/auto/completedTask"
    classDataPath = "/media/alextay96/Storage/frame_train_2"
    Parallel(n_jobs=1)(delayed(move)(path)
                       for path in glob.iglob(basePath + '**/*', recursive=False))
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
