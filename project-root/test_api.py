import urllib.request, urllib.error
try:
    req = urllib.request.Request(
        'http://localhost:8000/chat', 
        data=b'{"message": "hi"}', 
        headers={'Content-Type': 'application/json'}
    )
    r = urllib.request.urlopen(req)
    print(r.read())
except urllib.error.HTTPError as e:
    print(e.read().decode())
