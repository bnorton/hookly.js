# hookly.js

####Hookly funnels messages to your front-end application in realtime.  


**Receive realtime messages sent from anywhere** For example, after successful update to data, show changes to the other collaborators. Upon completion of background work update the UI with the result. Deliver webhooks to your client-side javascript application.

[![Build Status](https://semaphoreci.com/api/v1/projects/4cd88126-07f2-4864-a461-63216569b8af/433515/badge.svg)](https://semaphoreci.com/bnorton/hookly-js)  
[![Circle CI](https://circleci.com/gh/bnorton/hookly.js.svg?style=svg&circle-token=fec6865c1f78fd8c34191b19d5132f697f88c85c)](https://circleci.com/gh/bnorton/hookly.js)  
[![Code Climate](https://codeclimate.com/github/bnorton/hookly.js/badges/gpa.svg)](https://codeclimate.com/github/bnorton/hookly.js)  


 - [Installation](#installation)
 - [Getting Started](#getting-started)
 - [Advanced Setup](#advanced-setup)
 - [Testing](#testing)
 
##Installation

via npm
```bash
npm install hookly.js
```

via bower
```bash
bower install hookly.js
```


#Getting Started

####Start with an working example and build from there

 1. Connect with your [Project token](https://hookly.herokuapp.com/dashboard/tokens) - (called `token`).
 ```javascript
 hookly.start('{{token}}');
 ```
 
 1. Publish a new message to a channel - realtime updates when the name changes
 ```javascript
 hookly.notify('#updates', { id: 1538, name: 'New name' })
 ```

 1. Listen for messages published to a specific channel - show changes live
 ```javascript
 hookly.on('#updates', function(data) {
   // data is { id: 1538, name: 'New name' }
 });
 ```
 
# Advanced Setup

#### Send updates to specific user

 1. When your user is logged in, add their user identifier (called `uid`).
 ```javascript
 hookly.start('{{token}}', '{{uid}}');
 ```
 
 1. Send a message from the current user to another (who is identified by `5a4f67`)
 ```javascript
 hookly.notify('#updates', '5a4f67', { id: 1538, name: 'New name' }
 ```

# Testing

#### Send and receive messages without making external connections

 1. Start hookly with an explicit URL (that points to nothing)
 ```javascript
 hookly.start('{{token}}', null, 'http://localhost:3000')
 ```

 1. Leave all of your other channel listening code alone

 1. Send a message to your channel listeners explicitly call the hookly adapter with a `payload`
  - Send a `slug` as the channel
  - Send a `body` as the object to pass to the channel listener
  - Send a `kind` of 'local'

 ```javascript
 hookly.adapter.call(JSON.stringify({slug: '#updates', body: {id: 5}, kind: 'local'}))
 ```
