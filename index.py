import json
import innertube
import sys
client = innertube.InnerTube(innertube.Client.WEB)

id = sys.argv[1]
function = sys.argv[2]


def getRelated(id):
    data = client.next(id)

    related = data.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results
    newList = []

    for i in range(0, len(related)-1):
        compactVideoRenderer = related[i].compactVideoRenderer
        newList.append({"videoId": compactVideoRenderer.videoId,
                        "thumbnail": {"url": compactVideoRenderer.thumbnail.thumbnails[0].url,
                                      "width": compactVideoRenderer.thumbnail.thumbnails[0].width,
                                      "height": compactVideoRenderer.thumbnail.thumbnails[0].height
                                      },
                        "title": compactVideoRenderer.title.simpleText,
                        "channel": compactVideoRenderer.longBylineText.runs[0].text
                        })


def search(query):
    data = client.search(query)
    searchResults = data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[
        0].itemSectionRenderer.contents
    jsonData = json.dumps({"data": searchResults}, indent=4)
    f = open("./pySearch.json", "w")
    f.write(jsonData)
    newList = []
    for i in range(0, len(searchResults)-1):
        videoRenderer = searchResults[i].videoRenderer
        newList.append({
            "videoId": videoRenderer.videoId,
            "thumbnail":
                {"url": videoRenderer.thumbnail.thumbnails[0].url,
                 "width": videoRenderer.thumbnail.thumbnails[0].width,
                 "height": videoRenderer.thumbnail.thumbnails[0].height
                 },
            "title": videoRenderer.title.runs[0].text,
            "channel": videoRenderer.longBylineText.runs[0].text
        })


if(function == "getRelated"):
    getRelated(id)
elif(function == "search"):
    search(id)
