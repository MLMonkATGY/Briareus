import json
import os

from tqdm import tqdm
if __name__ == '__main__':
    classDatapath = "/home/alextay96/Desktop/workspace/3d-eff/Briareus/python-tools/trainlist01.txt"
    genPath = "./video_source.json"

    # print(fullrow)
    payload = {}
    with open(classDatapath, 'r') as out:
        a = out.read()
        allRows = a.split("\n")
        classNameIdx = {}
        for idx, row in enumerate(tqdm(allRows)):
            if(row == ""):
                continue
            individualVid = row.split(
                "/")[1].split(" ")[0].replace(".mp4", "").replace("_c1", "")
            classNameIdx[individualVid] = idx
        with open(genPath, 'w') as outfile:

            json.dump(classNameIdx, outfile)

        # print(fullpath)
