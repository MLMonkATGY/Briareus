import os
from tqdm import tqdm
if __name__ == '__main__':
    classDatapath = "/media/alextay96/Storage/classdata_train"
    allClassDir = os.listdir(classDatapath)
    fullTxtArray = []
    for classIdx, classdir in enumerate(tqdm(allClassDir)):
        ucfFilename = "v_{0}_g01_c{1}.mp4".format(classdir, 1)
        fullrow = classdir+"/"+ucfFilename
        fullTxtArray.append(fullrow)
        print(fullrow)

    with open('./testlist01.txt', 'w') as out:
        for n in fullTxtArray:
            out.write(n + '\n')
        # print(fullpath)