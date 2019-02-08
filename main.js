const { app, BrowserWindow, ipcMain } = require('electron')
const mongoose = require('mongoose')


const Schema = mongoose.Schema;
const dburl = 'mongodb://admin:etganskesjuktpassord1@ds223605.mlab.com:23605/cpchat'
let mainWindow


// Conect to DB (mLab)
mongoose.connect(dburl, { useNewUrlParser: true }, (err) => {
	console.log('mongo db connection', err)
})

// Schema - CHANNEL
const channelSchema = new Schema({
	title: String,
	topic: String,
	users: {
		name: String
	}
})
// Schema - CHAT
const chatSchema = new Schema({
	name: String,
	message: String,
	date: String,
	channel: String
})
// Schema - User
const userSchema = new Schema({
  name: String
});

// Models
const User = mongoose.model('users', {name: String})
const Channel = new mongoose.model('channel', channelSchema)
const Chat = new mongoose.model('chat', chatSchema)

// Create user
function createUser(username) {
	const user = new mongoose.model('users', userSchema)
	var newUser = new user({
		name: username
	})
}

// Create channel
function createChannel(title, topic) {
	const channel = new mongoose.model('channel', channelSchema)
	var newChannel = new channel({
		title: title,
		topic: topic
	})
	newChannel.save(function(err) {
		if(err) return handleError(err)
		//saved
	})
}

// Add message
function addMessage() {
	var chat = mongoose.model('chat', chatSchema)

	var newMessage = new chat({
		name: 'Endre',
		message: 'Testdata lorem ipsum osv',
		date: '20.02.2019',
		channel: 'general'
	})
	newMessage.save(function (err) {
		if (err) return handleError(err)
		// saved
	})
}

// Get chat
function getChat(selectedChannel) {
	Chat.find({ channel: selectedChannel }).exec(function(err, docs) {
		console.log(docs[0].name)
		console.log(docs[0].channel)
		console.log(docs[0].message)
	})
}

// Get all users
function getAllUsers() {
	var query = User.find({})
	query.exec(function (err, docs) {
		docs.forEach(element => {
			console.log('Name of user: ' + element.name)
		})
	})
}


// Get user
function getUser(input, userFound) {
	let query = User.find({name: input })
	query.exec().then(function (user) {
		// success
		userFound(user)
	}).catch(function(err) {
		// error
		console.log('Error, message: ' + err)
	})
}

// Get all channels
function getAllChannels(input, resChannels) {
	let query = Channel.find({})
	query.exec().then(function(channels) {
		// success
		resChannels(channels)
	}).catch(function(err) {
		// error
		console.log('Error, message (get all channels): ' + err)
	})
	
	// query.exec(function (err, docs) {
	// 	docs.forEach(element => {
	// 		console.log('CHANNELS______: ' + element.title)
	// 	})
	// 	// return docs
	// })
}




// ==================================================================
/// IPC HANDLING
// ==================================================================



// START UP - SEND ALL CHANNELS
ipcMain.on('startup', function(event, arg) {
	getAllChannels(arg, function(_allChannels) {
		event.sender.send('channel_served', _allChannels);
	})
});

// LOGIN ATTEMPT - GET USER
ipcMain.on('login', function(event, userinput) {
	getUser(userinput, function(user){
		if (user.length) {
			event.sender.send('login_acepted', user);
		} else {
			console.log('no user here')
		}
	})
})





ipcMain.on('getCurrentChannel', function(event, currentChannel) {
	let query = Chat.find({channel: currentChannel })
	query.exec().then(function (chat) {
		// success
		if (chat.length === 0) {
			event.sender.send('channel-chat', false)
		}
		event.sender.send('channel-chat', chat)
	}).catch(function(err) {
		//error
		console.log('Error, could not get current chat from channel: ' + err)
	})
})


function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({ 
		width: 1200, 
		height: 800,
		transparent: true
	})

	// and load the index.html of the app.
	mainWindow.loadFile('index.html')


	// ipcMain.send('channels', _channels);

	// Open the DevTools.
	  mainWindow.webContents.openDevTools()

	// Emitted when the window is closed.
	mainWindow.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
	})
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow()
	}
})