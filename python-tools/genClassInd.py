import os
from tqdm import tqdm
if __name__ == '__main__':
    trainlistPath = "/home/alextay96/Desktop/workspace/3d-eff/Briareus/python-tools/trainlist01.txt"
    classIndPath = "./classInd.txt"
    fullTxtArray = []

    with open(trainlistPath, 'r') as out:
        a = out.read().split("\n")
        for n in a:
            if(n == ""):
                continue
            classname = n.split("/")[0]
            classIdx = n.split(" ")[1]
            row = "{0} {1}".format(classIdx, classname)
            fullTxtArray.append(row)
    with open(classIndPath, 'w') as out:
        for elem in fullTxtArray:
            out.write(elem + "\n")

            # print(fullpath)
