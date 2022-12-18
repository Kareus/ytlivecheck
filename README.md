# ytlivecheck
(알고리즘 땜시) 로그인도 구독도 안하는 나를 위한 유튜브 라이브 확인용 확장 프로그램

chrome extension to check the youtube live, without login or subscribe.



### You should know

- 귀찮아서 ui 안 만들었음. 그래서 그냥 쓰기엔 드럽게 불편함.

  (not implemented ui cuz im lazy. so it is MUCH uncomfortable to use.)

- 함수는 만들어둠. 쓰려면 extensions 탭에서 서비스 워커 개발자 콘솔 켜야 됨

  (but functions are ready. use them in the service worker devtools. you can access at chrome://extensions)

  - handle_list : 확인할 채널의 핸들을 저장하는 리스트. 여기다가 핸들을 추가해야함. ex) @example

    you should put handles of the channels you want to check here

  - autoRemove_seconds : 알림을 자동으로 지우는 시간 (초 단위). 양수여야 작동함

    seconds to wait to remove notifications automatically. works only if positive value.

  - notified : 알림으로 뜬 라이브 ID들이 여기 저장됨. 리스트를 지우면 체크할 때 다시 알림

    live ids which already notified are stored here. renotifies if list is clear.

  - refresh(renotify:Boolean) : 즉 시 확 인. renotify가 true면 이미 알린 것도 다시 알림.

    immeidately checks the live. renotifies if renotify is true.

  - loadSettings(), saveSettings() : 설정 저장하고 부르는 함수들. (handle_list, autoRemove_seconds 등)

    literally load and save settings. (stores handle_list and autoRemove_seconds.)

    

- 설정은 확장 프로그램 켤 때 불러옴

  load settings when extension is started.

- 라이브 확인할 때마다 설정 저장함

  save settings when checking the youtube lives.

- 확장프로그램 시작 이후 5분마다 체크함. refresh 호출하면 그때부터 5분 재서 체크함.

  checks the youtube live every 5 minutes as extension started.

  refresh function will reset the timer.

- API 안 쓰고 page 긁어오는 거라 언젠가는 작동 안 할 수도 있음.

  I did not used yt api, just crawling the page. cannot guarantee it will work later.

- 브라우저 켜는 것 만으로는 얘가 작동을 안해서 켤때마다 체크하게 함.

  이전 버전에선 안 거슬릴 것 같아서 id 저장 안 하고 그냥 냅둔다고 했는데 쓰다 보니 드럽게 거슬려서 id 저장하고 체크하게 만듬.

  checks when you start up the browser, so it can notify multiple times whenever you start up.

  I said it would not be much bothering in prev version, but it actually was, so I added id store-and-check.

- 백그라운드에서 앱 실행이 꺼져 있으면 알림 배너와 소리가 재생되지 않으니 확인 바람.

  google chrome does not show popup notification banners and play the sound, when the background app is disabled.