$(function() {

    var COLOR_SCHEME = [
        '#f44336', '#e91e63', '#9c27b0', '#4caf50',
        '#ff9800', '#009688', '#03a9f4'
    ];
  
    // Initialize window variable
    var $window = $(window);

    // Intialize other variables
    var $usernameInput = $('.username-input'),
        $messages = $('.messages'),
        $inputMessage = $('.type-message'),
        $loginPage = $('.login.page'),
        $chatPage = $('.chat.page'); 
  
    // Initialize variables that handle the user details
    var username;
    var connected = false;
    var typing = false;
    var lastTyped;
    var $currentInput = $usernameInput.focus();
  
    // Initialize the socket variable 
    var socket = io();
  
    addParticipantsMessage = (data) => {
        log("Number of participants: " + data.numUsers);
    }
  
    // Function to handle the username
    setUsername = () => {
        username = cleanInput($usernameInput.val().trim());
  
        // Check if username exists
        if (username) {
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off('click');
            $currentInput = $inputMessage.focus();
            
            // Send the username using the socket event
            socket.emit('add user', username);
        } else {
            console.error('Error with the username' + err)
        }
    }
  
    // Function for sending a message
    sendMessage = () => {
    // console.log($inputMessage, $inputMessage.val())
        var message = cleanInput($inputMessage.val());

        // Check if connection exists and if the message has content
        if (message && connected) {
            $inputMessage.val('');
            addChatMessage({ username: username, message: message });
            
            // Send a socket event for a new message
            socket.emit('new message', message);
        }
    }
  
    // add the message to the log
    log = (message, options) => {
        var $element = $('<li>').addClass('log').text(message);
        addMessageElement($element, options);
    }
  
    // Adds the visual chat message to the message list
    addChatMessage = (data, options) => {
        // Don't fade message if someone was typing
        var $typingMessages = getTypingMessages(data);
        options = {};
        
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        // Span for the username
        var $usernameDiv = $('<span class="username"/>')
            .text(data.username)
            .css('color', getUsernameColor(data.username));

        // Span for the message
        var $messageBodyDiv = $('<span class="messageBody">')
            .text(data.message);

        var typingClass = data.typing ? 'typing' : '';
        
        var $messageDiv = $('<li class="message"/>')
            .data('username', data.username)
            .addClass(typingClass)
            .append($usernameDiv, $messageBodyDiv);

        addMessageElement($messageDiv, options);
    }
  
    // Display usertyping
    addChatTyping = (data) => {
        data.typing = true;
        data.message = 'is typing...';
        addChatMessage(data);
    }
  
    // Remove usertyping
    removeChatTyping = (data) => {
        getTypingMessages(data).fadeOut(function () {
            $(this).remove();
        });
    }
  
    addMessageElement = (el, options) => {
        var $el = $(el);

        // Default values
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        // If any options are specified, apply them
        if (options.fade) {
            $el.hide().fadeIn(100);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }

        $messages[0].scrollTop = $messages[0].scrollHeight;
    }
  
    // Function to clean up the input message
    cleanInput = (input) => {
      return $('<div/>').text(input).html();
    }
  
    // Event to track the typing
    updateTyping = () => {
        if (connected) {
            if (!typing) {
                socket.emit('typing');
                typing = true;
            }
            // get the last typing time using the inbuilt functions
            lastTyped = (new Date()).getTime();
            
            setTimeout(function () {
                var typingTimer = (new Date()).getTime();
                var timeDiff = typingTimer - lastTyped;
                if (timeDiff >= 500 && typing) {
                socket.emit('stop typing');
                typing = false;
                }
            }, 500);
        }
    }
  
    getTypingMessages = (data) => {
        return $('.typing.message').filter(function (i) {
            return $(this).data('username') === data.username;
        });
    }
  
    // apply a color for the username
    getUsernameColor = (username) => {
        var index = Math.floor(Math.random() * COLOR_SCHEME.length);
        return COLOR_SCHEME[index];
    }
  

    /**
     * Functions to keep track of the keyboard events
     */

    $window.keydown(function (event) {
        // Checks if the user hits the Enter button which has a code of '13'
        if (event.which === 13) {
            if (username) {
                sendMessage();
                socket.emit('stop typing');
                typing = false;
            } else {
                setUsername();
            }
        }
    });
  
    $inputMessage.on('input', function() {
        updateTyping();
    });  
  
  
    /**
     * Declaration of Socket Events 
     */
  
    // Login Event
    socket.on('login', function (data) {
        connected = true;
        // Display the welcome message
        var message = "Welcome to Socket.IO Chat – ";
        log(message, {
        prepend: true
        });
        addParticipantsMessage(data);
    });

    // Disconnected Event
    socket.on('disconnect', function () {
        log('you have been disconnected');
    });

    // Trying to reconnect Event
    socket.on('reconnect', function () {
        log('you have been reconnected');
        if (username) {
            socket.emit('add user', username);
        }
    });

    // Error on reconnecting event
        socket.on('reconnect_error', function () {
        log('attempt to reconnect has failed');
    });
  
    // New message Event
    socket.on('new message', function (data) {
        addChatMessage(data);
    });
  
    // New user joined Event
    socket.on('user joined', function (data) {
        log(data.username + ' joined');
        addParticipantsMessage(data);
    });
  
    // User left Event
    socket.on('user left', function (data) {
        log(data.username + ' left');
        addParticipantsMessage(data);
        removeChatTyping(data);
    });
  
    // Typing Event
    socket.on('typing', function (data) {
        addChatTyping(data);
    });
  
    // Stop typing Event
    socket.on('stop typing', function (data) {
        removeChatTyping(data);
    });
  });
  