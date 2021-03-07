# colorparrot-twitter-bot
A bot that tweets random colors and lets you invent new ones

https://twitter.com/color_parrot

## example commands:
  - @color_parrot Majestic Green #42f45c
  - @color_parrot Indigo Blue
  - @color_parrot What is the name of #dd3333
  - @color_parrot What color is this?
  - @color_parrot What is the dominant color?

## requirements:
  - node >= 10.5
  - redis
  - heroku 
  
## redis commands:
 - lrange proposals 0 -1 (get list of proposals)
 - lrange flood 0 -1 (get list of flood messages)
 - smembers postedColors (get set of posted colors)
 
heroku deploy help: heroku_help.txt

