// Copyright 2014 Globo.com Player authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

var BaseObject = require('../base/base_object')
var CoreFactory = require('./core_factory')
var Loader = require('./loader')
var assign = require('lodash.assign')
var find = require('lodash.find')
var Events = require('events')
var uniqueId = require('../base/utils').uniqueId
var PlayerInfo = require('./player_info')

class Player extends BaseObject {
  constructor(options) {
    super(options)
    window.p = this
    var defaultOptions = {playerId: uniqueId(""), persistConfig: true, width: 640, height: 360, baseUrl: 'http://cdn.clappr.io/latest'}
    this.options = assign(defaultOptions, options)
    this.options.sources = this.normalizeSources(options)
    this.loader = new Loader(this.options.plugins || {})
    this.coreFactory = new CoreFactory(this, this.loader)
    PlayerInfo.currentSize = {width: options.width, height: options.height}
    if (this.options.parentId) {
      this.setParentId(this.options.parentId)
    }
  }

  setParentId(parentId) {
    var el = document.querySelector(parentId)
    if (el) {
      this.attachTo(el)
    }
  }

  attachTo(element) {
    this.options.parentElement = element
    this.core = this.coreFactory.create()
    this.addEventListeners()
  }

  addEventListeners() {
    this.listenTo(this.core.mediaControl,  Events.MEDIACONTROL_CONTAINERCHANGED, this.containerChanged)
    var container = this.core.mediaControl.container
    if (!!container) {
      this.listenTo(container, Events.CONTAINER_PLAY, this.onPlay)
      this.listenTo(container, Events.CONTAINER_PAUSE, this.onPause)
      this.listenTo(container, Events.CONTAINER_STOP, this.onStop)
      this.listenTo(container, Events.CONTAINER_ENDED, this.onEnded)
      this.listenTo(container, Events.CONTAINER_SEEK, this.onSeek)
      this.listenTo(container, Events.CONTAINER_TIMEUPDATE, this.onTimeUpdate)
    }
  }

  containerChanged() {
    this.stopListening()
    this.addEventListeners()
  }

  onPlay() {
    this.trigger(Events.PLAYER_PLAY)
  }

  onPause() {
    this.trigger(Events.PLAYER_PAUSE)
  }

  onStop() {
    this.trigger(Events.PLAYER_STOP, this.getCurrentTime())
  }

  onEnded() {
    this.trigger(Events.PLAYER_ENDED)
  }

  onSeek(percent) {
    this.trigger(Events.PLAYER_SEEK, percent)
  }

  onTimeUpdate(position, duration) {
    this.trigger(Events.PLAYER_TIMEUPDATE, position, duration)
  }

  is(value, type) {
    return value.constructor === type
  }

  normalizeSources(options) {
    var sources = options.sources || (options.source !== undefined? [options.source.toString()] : [])
    return sources.length === 0 ? ['no.op'] : sources
  }

  resize(size) {
    this.core.resize(size);
  }

  load(sources) {
    this.core.load(sources)
  }

  destroy() {
    this.core.destroy()
  }

  play() {
    this.core.mediaControl.container.play();
  }

  pause() {
    this.core.mediaControl.container.pause();
  }

  stop() {
    this.core.mediaControl.container.stop();
  }

  seek(time) {
    this.core.mediaControl.container.setCurrentTime(time);
  }

  setVolume(volume) {
    this.core.mediaControl.container.setVolume(volume);
  }

  mute() {
    this.core.mediaControl.container.setVolume(0);
  }

  unmute() {
    this.core.mediaControl.container.setVolume(100);
  }

  isPlaying() {
    return this.core.mediaControl.container.isPlaying();
  }

  getPlugin(name) {
    var plugins = this.core.plugins.concat(this.core.mediaControl.container.plugins);
    return find(plugins, function(plugin) {
      return plugin.name === name;
    });
  }

  getCurrentTime() {
    return this.core.mediaControl.container.getCurrentTime()
  }

  getDuration() {
    return this.core.mediaControl.container.getDuration()
  }
}

module.exports = Player
