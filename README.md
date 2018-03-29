Spotify Counter
---------------

A script to count how many minutes of music you played in Spotify while you were working.

Usage:
   * Visit localhost:8888/login to log in.
   * If your token expires, try http://localhost:8888/refresh_token
   * Shows progress updates every 10 seconds.

Tips:
   * Pause your music when you aren't working productively.
   * Unpause your music when you are working productively.

Inspiration
-----------

> Eventually working around high-productivity professionals like John Carmack made me realize that if you want to excel, then you have to work hard and focus the whole time.

> I remember Carmack talking about productivity measurement.  While working he would play a CD, and if he was not being productive, he'd pause the CD player.  This meant any time someone came into his office to ask him a question or he checked email he'd pause the CD player.  He'd then measure his output for the day by how many times he played the CD (or something like that -- maybe it was how far he got down into his CD stack).  I distinctly remember him saying "So if I get up to go to the bathroom, I pause the player". 

> You know what's pretty hardcore?  Thinking that going to the bathroom is essentially the same as fucking off.


-- Brian Hook, "Smart Guy Productivity Pitfalls" http://bookofhook.blogspot.com/2013/03/smart-guy-productivity-pitfalls.html

TODO
----

* Give feedback when not able to get status from Spotify (ie not authorized, network down)
* Guide user to log in if they haven't
* Maybe a GUI
* Central tracking service
