
from typing import OrderedDict
import scrapy
from tutorial.items import ChannelItems
from scrapy.selector import Selector
import json
import chompjs
from nested_lookup import nested_lookup


class QuotesSpider(scrapy.Spider):
    name = "quotes"

    def start_requests(self):
        urls = [
            'https://www.youtube.com/results?search_query=hololive2434',
            'https://www.youtube.com/results?search_query=vtuber',
            'https://www.youtube.com/results?search_query=nijisanji',
            'https://www.youtube.com/results?search_query=shigureui',
            'https://www.youtube.com/results?search_query=nijisanji+vtuber',
            'https://www.youtube.com/results?search_query=2434+vtuber',
            'https://www.youtube.com/results?search_query=vtuber+translation',
            'https://www.youtube.com/results?search_query=vtuber+funny+moment',
            'https://www.youtube.com/results?search_query=vtuber+official',
            'https://www.youtube.com/results?search_query=hololive+official',
            'https://www.youtube.com/results?search_query=vtuber+gaming',
            'https://www.youtube.com/results?search_query=vtuber+compilation',
            'https://www.youtube.com/results?search_query=hololive+funny+compilation',
            'https://www.youtube.com/results?search_query=vtuber+clip+compilation',
            'https://www.youtube.com/results?search_query=vtuber+funny',


        ]
        for url in urls:
            yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response):

        payloads = ChannelItems()
        ccc = response.xpath(
            "//script[contains(., 'videoId')]/text()").getall()
        xzxc = OrderedDict(chompjs.parse_js_object(ccc[0]))
        aasdas = nested_lookup('videoRenderer', xzxc)
        bbbb = nested_lookup("ownerText", xzxc)
        channelNames = nested_lookup("text", bbbb)
        allChannels = []
        allChannelNames = []

        for elem in bbbb:
            metadata = nested_lookup("url", elem)
            channelNames = nested_lookup("text", elem)[0]
            link = metadata[0]
            if("channel" in link):
                # allChannels.append(link.replace("/channel/", ""))
                # allChannelNames.append(channelNames)
                info = {
                    "c": link.replace("/channel/", ""),
                    "n": channelNames
                }
                allChannels.append(info)
        payloads['channelIds'] = (allChannels)
        payloads['channelName'] = (allChannelNames)

        yield payloads
