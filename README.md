# colorparrot-twitter-bot
A bot that tweets random colors and lets you invent new ones

https://twitter.com/color_parrot

# example commands:
  - @color_parrot Majestic Green #42f45c
  - @color_parrot Indigo Blue
  - @color What is the name of #dd3333

# requirements:
  - node >= 10.5
  - reis (setup https://elements.heroku.com/addons/heroku-redis)
  - heroku 
  
redis commands:
 - lrange proposals 0 -1 (get list of proposals)
 - lrange flood 0 -1 (get list of flood messages)
 - smembers postedColors (get set of posted colors)

