import json
# from tokenize import Number
import innertube
import sys
client = innertube.InnerTube(innertube.Client.WEB)

arg1 = sys.argv[2]
function = sys.argv[1]


# def removeItemFromList(list: list, index: int):
#     retList = []
#     for i in range(0, len(list)-1):
#         if(i != index):
#             retList.push(list[i])
#     return retList


# def purgeEmpty(listOfDict: list):
#     retDict = {}
#     for i in range(0, len(listOfDict)-1):
#         dict = listOfDict[i]
#         for el in dict:
#             if el == {}:
#                 listofDict = removeItemFromList(listOfDict, i)
#             else:
#                 listOfDict = purgeEmpty(listOfDict)
#     return listOfDict
# # def purgeEmpty(listOFDict):
# #     for


# def getRelated(id):
# if(id == id):
#     print(id)
# data = client.next(id)

# related = data.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results
# newList = []

# for i in range(0, len(related)-1):
#     compactVideoRenderer = related[i].compactVideoRenderer
#     if compactVideoRenderer.videoId != {}:
#         newList.append({"id": compactVideoRenderer.videoId,
#                         "thumbnail": {"url": compactVideoRenderer.thumbnail.thumbnails[0].url,
#                                       "width": compactVideoRenderer.thumbnail.thumbnails[0].width,
#                                       "height": compactVideoRenderer.thumbnail.thumbnails[0].height
#                                       },
#                         "title": compactVideoRenderer.title.simpleText,
#                         "channel": compactVideoRenderer.longBylineText.runs[0].text
#                         })

# jsonData = json.dumps({"data": newList}, indent=4)
# print(jsonData)


def getNext(id, index):
    data = client.next(id)
    related = data.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results
    a = index
    while related[a].compactVideoRenderer == {}:
        a = a+1
    compactVideoRenderer = related[a].compactVideoRenderer
    next = {"id": compactVideoRenderer.videoId,
            "thumbnail": {"url": compactVideoRenderer.thumbnail.thumbnails[0].url,
                          "width": compactVideoRenderer.thumbnail.thumbnails[0].width,
                          "height": compactVideoRenderer.thumbnail.thumbnails[0].height
                          },
            "title": compactVideoRenderer.title.simpleText,
            "channel": compactVideoRenderer.longBylineText.runs[0].text
            }
    jsonData = json.dumps({"data": next}, indent=4)
    print(jsonData)


def search(query):
    data = client.search(query)
    searchResults = data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[
        0].itemSectionRenderer.contents
    newList = []
    for i in range(0, len(searchResults)-1):
        videoRenderer = searchResults[i].videoRenderer
        if videoRenderer.videoId != {}:
            newList.append({
                "id": videoRenderer.videoId,
                "thumbnail":
                    {"url": videoRenderer.thumbnail.thumbnails[0].url,
                     "width": videoRenderer.thumbnail.thumbnails[0].width,
                     "height": videoRenderer.thumbnail.thumbnails[0].height
                     },
                "title": videoRenderer.title.runs[0].text,
                "channel": videoRenderer.longBylineText.runs[0].text
            })
    jsonData = json.dumps({"data": newList}, indent=4)
    print(jsonData)


if(function == "getNext"):
    arg2 = sys.argv[3]
    arg2 = int(arg2, 10)
    getNext(arg1, arg2)
elif(function == "search"):
    search(arg1)
