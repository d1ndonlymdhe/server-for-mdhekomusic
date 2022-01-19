import json
# from tokenize import Number
import innertube
import sys
client = innertube.InnerTube(innertube.Client.WEB)

id = sys.argv[1]
function = sys.argv[2]


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


def getRelated(id):
    data = client.next(id)

    related = data.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results
    newList = []

    for i in range(0, len(related)-1):
        compactVideoRenderer = related[i].compactVideoRenderer
        if compactVideoRenderer != {}:
            newList.append({"id": compactVideoRenderer.videoId,
                            "thumbnail": {"url": compactVideoRenderer.thumbnail.thumbnails[0].url,
                                          "width": compactVideoRenderer.thumbnail.thumbnails[0].width,
                                          "height": compactVideoRenderer.thumbnail.thumbnails[0].height
                                          },
                            "title": compactVideoRenderer.title.simpleText,
                            "channel": compactVideoRenderer.longBylineText.runs[0].text
                            })
    jsonData = json.dumps({"data": newList}, indent=4)
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


if(function == "getRelated"):
    getRelated(id)
elif(function == "search"):
    search(id)
