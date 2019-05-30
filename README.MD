# ClipEx

## A node.js tool for twitch  

Clipex is basically just a simple node.js script, which allows you to retrieve all of a twitch channels clips and batch download them.  

Right now you can only download clips from twitch channels, not a specific game. Why? Couldn't be bothered yet to implement it.  

## Requirements and Installation  

`Node.js ~10` and `npm` are required.  
To install the required dependencies, simply run `npm --save i`.  

You need to have a valid Twitch API Client ID and Access Token. See https://dev.twitch.tv/ for information about how to obtain those.  

There are two options for configurating the script. Either using a `.env` file (see example `.env.example` for details; rename to `.env`) OR by specifying the Client ID and Token via a command line argument.  

If you run `node index.js --help`, it should give you a list of valid arguments.  