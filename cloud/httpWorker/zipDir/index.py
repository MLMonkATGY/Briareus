# -*- coding: utf-8 -*-

import os
import zipfile
import logging
import json
import uuid

# if you open the initializer feature, please implement the initializer function, as below:
# def initializer(context):
#    logger = logging.getLogger()
#    logger.info('initializing')


def handler(environ, start_response):
    context = environ['fc.context']
    request_uri = environ['fc.request_uri']
    for k, v in environ.items():
        if k.startswith('HTTP_'):
            # process custom request headers
            pass
    # do something here
    basePath = "/mnt/auto/zipOutput"
    os.makedirs(basePath, exist_ok=True)

    targetZip = os.path.join(basePath, str(uuid.uuid1()) + ".zip")
    zf = zipfile.ZipFile(targetZip, "w")
    bb = "/mnt/auto/completedTask"
    try:
        request_body_size = int(environ.get('CONTENT_LENGTH', 0))
    except (ValueError):
        request_body_size = 0
    request_body = environ['wsgi.input'].read(request_body_size)
    # print(event)
    req = json.loads(request_body)
    a = req['pathList']
    for dir in a:
        for root, dirs, files in os.walk(os.path.join(bb, dir)):
            for file in files:
                zf.write(os.path.join(root, file))
    status = '200 OK'
    response_headers = [('Content-type', 'text/plain')]
    start_response(status, response_headers)
    return [bytes(targetZip, 'utf-8')]
