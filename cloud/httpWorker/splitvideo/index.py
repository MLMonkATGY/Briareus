# -*- coding: utf-8 -*-

import json
import os
import subprocess
import logging
HELLO_WORLD = b'Hello world!\n'

# if you open the initializer feature, please implement the initializer function, as below:
# def initializer(context):
#    logger = logging.getLogger()
#    logger.info('initializing')
# -*- coding: utf-8 -*-
# if you open the initializer feature, please implement the initializer function, as below:
# def initializer(context):
#   logger = logging.getLogger()
#   logger.info('initializing')


def handler(event, context):
    logger = logging.getLogger()
    # print("This is event")
    try:
        request_body_size = int(event.get('CONTENT_LENGTH', 0))
    except (ValueError):
        request_body_size = 0
    request_body = event['wsgi.input'].read(request_body_size)
    # print(event)
    req = json.loads(request_body)
    sourcePath = req['sourcePath']
    completedDirName = sourcePath.split("/")[0]
    basePath = "/mnt/auto/eventData"
    completedTaskBasePath = "/mnt/auto/completedTask"
    vidPath = os.path.join(
        basePath, sourcePath)
    # vidPath = "./output321.avi"
    payloadBasePath = os.path.join(
        completedTaskBasePath, completedDirName)
    cmd = ['ffmpeg', '-i', vidPath, "-s", "224x224", "-vf",
           "fps=4", "{0}/image_%05d.jpg".format(payloadBasePath)]

    try:
        os.makedirs(payloadBasePath, exist_ok=True)
        subprocess.run(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

    except subprocess.CalledProcessError as exc:
        logger.error('returncode:{}'.format(exc.returncode))
        # logger.error('cmd:{}'.format(exc.cmd))
        # logger.error('output:{}'.format(exc.output))
        # logger.error('stderr:{}'.format(exc.stderr))
        # logger.error('stdout:{}'.format(exc.stdout))

    if(os.path.exists(payloadBasePath)):
        logger.info('completed payload exist')
        # logger.info(os.path.getsize(payloadBasePath))status = '200 OK'
    response_headers = [('Content-type', 'text/plain')]
    status = '200 OK'
    context(status, response_headers)

    return [bytes(payloadBasePath, 'utf-8')]
