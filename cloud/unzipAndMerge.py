import os
import zipfile
from joblib import Parallel, delayed
dir_name = '/media/alextay96/Storage/zipOutput'
extension = ".zip"
targetDir = "/media/alextay96/Storage/unzipOutput"
os.chdir(dir_name)  # change directory from working dir to dir with files


def unzipWorker(item):
    if item.endswith(extension):  # check for ".zip" extension
        file_name = os.path.abspath(item)  # get full path of files
        zip_ref = zipfile.ZipFile(file_name)  # create zipfile object
        zip_ref.extractall(targetDir)  # extract file to dir
        zip_ref.close()  # close file


Parallel(n_jobs=-1)(delayed(unzipWorker)(item)
                    for item in os.listdir(dir_name))
