# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
from tutorial.ORM.channelsTable import channelsTable
from itemadapter import ItemAdapter
import json

import sqlalchemy as db
import numpy as np
import uuid
from tutorial.ORM.EntityManager import EntityManager


class p2:

    def open_spider(self, spider):
        self.em = EntityManager.getInstance()

    def remove_duplicate(self, payloads):
        uniqueIdentifier = set([])
        deduplicatedpayloads = []
        for elem in payloads:
            identity = "{0}-{1}".format(elem["c"], elem["n"])
            if(identity not in uniqueIdentifier and elem["n"] is not None):
                uniqueIdentifier.add(identity)
                deduplicatedpayloads.append(elem)
        return deduplicatedpayloads

    def process_item(self, item, spider):

        connection = self.em.getConnection()
        channels = channelsTable()
        existed = connection.execute(
            db.select([channels.c.channel_id])).fetchall()
        existedChannelIds = [r[0] for r in existed]
        currentBatchChannels = self.remove_duplicate(item['channelIds'])

        currentBatchChannelNames = item['channelName']
        newObservedChannels = [
            x for x in currentBatchChannels if x['c'] not in (existedChannelIds)]

        if(len(newObservedChannels) != 0):
            query = db.insert(channels)
            values_list = []
            for elem in newObservedChannels:
                values_list.append(
                    {"channel_id": elem["c"], 'video_observed': 0, "channel_names": elem["n"]})

            ResultProxy = connection.execute(query, values_list)
            results = connection.execute(
                db.select([channels.c.channel_id])).fetchall()
            # featuresOutput = [dict(r) for r in results]

            # aaa=np.frombuffer(featuresOutput, dtype=np.float64)
            print(results)
        connection.close()

        return "HELLO"
