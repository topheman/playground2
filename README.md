TOPHEMAN PLAYGROUND V2
======================

##Intro

Try it at : [http://topheman-playground.herokuapp.com](http://topheman-playground.herokuapp.com/) (heroku instance).

Presentation : [http://slid.es/topheman/topheman-playground](http://slid.es/topheman/topheman-playground)

Once you snapped the QR-code with your phone, take control of the bouncing ball on your desktop screen, like a Wiimote, tilting your phone as you would do on a labyrinth game.

* Connect with multiple mobile devices
* Watch from multiple desktop/laptop screens

You can even use the devicemotion emulator to control the ball from your desktop.

Not a game, more of an experiment that could lead to a game …

Thanks to [remote-tilt](http://remote-tilt.com/) for the emulator.

![Topheman Playground](https://raw.github.com/topheman/playground2/master/app/public/src/css/img/topheman-playground-bandeau.png)

##Install

* `npm install`
* `node app.js 192.168.1.2:3000` (192.168.1.2:3000 being the public IP:PORT of your node server - port by default at 3000 - this is used to create the QR-Code)

##Next

I coded the [v1](https://github.com/topheman/playground1) about a year ago, and now I decided to refactor it so that it could be a sort of a boilerplate for some other games.

Take it, make your own games and tell me about it !


##Notes

My heroku instance doesn't support WebSockets, so socket.io fallbacks to xhr-polling. If you want to test a version with real WebSockets, you can try : [http://playground.topheman.kd.io:3000](http://playground.topheman.kd.io:3000/) although it only stays up for 20 min (after the VM goes asleep - so tweet me or whatever so I could lauch it).

When you'll browse the code, you'll see that there is a connection/disconnetion routine on the sockets which makes sure to disconnect any mobile client which has more than one socket opened (to prevent multiple dead balls). This was a tricky part, playing with the express session and the socket.io handshake :-) …