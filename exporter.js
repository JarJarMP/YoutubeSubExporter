// For Tampermonkey and Greasemonkey
// ==UserScript==
// @name        Youtube Subscription Exporter
// @namespace   https://github.com/JarJarMP/YoutubeSubExporter
// @version     1.0
// @description Export your Youtube Subscriptions
// @match       http://www.youtube.com/subscription_manager*
// @match       https://www.youtube.com/subscription_manager*
// @copyright   Péter Maróti (JarJarMP) 2014
// @require     http://code.jquery.com/jquery-latest.min.js
// ==/UserScript==

// JSLint
/*global localStorage: false, console: false, $: false, window: false, alert: false */

// ------------------------------------------------------------------
// Class
function Exporter() {
  var self = this;

  self.init();
}

// ------------------------------------------------------------------
// Initialize
Exporter.prototype.init = function () {
  var self = this;

  // Set up default values - logic
  self.localStoragePrefix = 'yse_';
  self.pagerTimeout = 500;
  self.urls = [];

  // Set up default values - layout
  self.viewElementsPrefix = 'yse_';
  self.viewOverlayID = self.viewElementsPrefix + 'overlay';
  self.viewContainerID = self.viewElementsPrefix + 'container';
  self.viewCloseButtonID = self.viewElementsPrefix + 'close';
  self.viewCopyToCBButtonID = self.viewElementsPrefix + 'copytoclipboard';
  self.viewCopyToCBTextAreaID = self.viewElementsPrefix + 'copytoclipboardta';
  self.viewFadeOutSpeed = 'medium';
  self.viewFadeInSpeed = 'medium';
};

// ------------------------------------------------------------------
// Checks if the Local Storage is supported
// Copied from Modernizer - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/storage/localstorage.js
Exporter.prototype.isLocalStorageSupported = function () {
  var mod = 'modernizr';

  try {
    localStorage.setItem(mod, mod);
    localStorage.removeItem(mod);
    return true;

  } catch (e) {
    return false;
  }
};

// ------------------------------------------------------------------
// Remove all urls from the Local Storage
Exporter.prototype.emptyUrls = function () {
  var self = this;

  localStorage.removeItem(self.localStoragePrefix + 'urls');
};

// ------------------------------------------------------------------
// Loads the saved urls from Local Storage, adds the new ones, writes back the new list into Local Storage
Exporter.prototype.updateUrls = function () {
  var self = this;

  self.loadUrlList();
  self.addNewUrlsToList();
  self.saveUrlList();
};

// ------------------------------------------------------------------
// Loads the saved urls from Local Storage
Exporter.prototype.loadUrlList = function () {
  var self = this;
  var urlsInStorage = '';

  urlsInStorage = localStorage.getItem(self.localStoragePrefix + 'urls');

  if (urlsInStorage === 'undefined' || urlsInStorage === null || urlsInStorage === '') {
    self.urls = [];
  } else {
    self.urls = JSON.parse(urlsInStorage);
  }
};

// ------------------------------------------------------------------
// Adds the new urls from the DOM into the list
Exporter.prototype.addNewUrlsToList = function () {
  var self = this;

  $.each($('.subscription-title-wrap a.subscription-title'), function () {
    var currentUrl = {};

    currentUrl.title = $(this).html().trim();
    currentUrl.link = 'http://www.youtube.com' + $(this).attr('href');

    self.urls.push(currentUrl);
  });
};

// ------------------------------------------------------------------
// Writes the url list into Local Storage
Exporter.prototype.saveUrlList = function () {
  var self = this;

  localStorage.setItem(self.localStoragePrefix + 'urls', JSON.stringify(self.urls));
};

// ------------------------------------------------------------------
// Returns with the next page button as a jQuery object or null if not found
Exporter.prototype.getNextButton = function () {
  var $nextButton = null;

  $.each($('a.yt-uix-pager-button'), function (key, value) {
    if ($(value).data('link-type') === 'next') {
      $nextButton = $(value);
    }
  });

  return $nextButton;
};

// ------------------------------------------------------------------
// Clicks on the button, which is a jQeury object param
Exporter.prototype.goToNextPage = function ($nextButton) {
  var self = this;
  var id = '';

  id = self.viewElementsPrefix + 'next_page_button';

  $nextButton.attr('id', id);
  document.getElementById(id).click();
};

// ------------------------------------------------------------------
// Displays different content for the user - local storag is not supported; result lis
Exporter.prototype.showContent = function (contentType) {
  var self = this;

  switch (contentType) {
  case 'no_local_storage':
    alert('YoutubeSubExporter - local storage is not supported, please update your browser for the latest to use this script!');
    break;

  case 'result':
    var urlHTML = '';
    var urlHTMLTextArea = '';

    // Load url list
    self.loadUrlList();

    // Create table from url list
    urlHTML = '<table>';
    $.each(self.urls, function (key, value) {
      urlHTML += '<tr><td>' + value.title + '</td><td><a href="' + value.link + '" target="_blank" title="' + value.title + '">' + value.link + '</a></td></tr>';
      urlHTMLTextArea += value.title + '&#9;' + value.link + '&#13;&#10;';
    });
    urlHTML += '</div>';

    // Overlay div
    $('<div/>', {id: self.viewOverlayID}).appendTo('body');
    $('#' + self.viewOverlayID).css({
      'display': 'none',
      'width': '100%',
      'height': '100%',
      'z-index': '19999999999',
      'position': 'fixed',
      'top': '0',
      'left': '0',
      'background': 'rgba(0,0,0,0.2)'
    });

    // Container div
    $('<div/>', {id: self.viewContainerID}).appendTo('#' + self.viewOverlayID);
    $('#' + self.viewContainerID).css({
      'display': 'none',
      'width': '84%',
      'height': '85%',
      'z-index': '9001',
      'position': 'relative',
      'margin': '2% 0 0 5%',
      'background': '#EFEFEF',
      'padding': '3% 3% 0',
      'font-family': 'Arial, sans-serif',
      'font-size': '22px',
      'border': '2px solid #AFAFAF',
      'overflow-y': 'auto',
    }).html(urlHTML);

    // Close button
    $('<div/>', {id: self.viewCloseButtonID}).appendTo('#' + self.viewContainerID);
    $('#' + self.viewCloseButtonID).css({
      'display': 'block',
      'width': '200px',
      'height': '36px',
      'position': 'absolute',
      'top': '10px',
      'right': '10px',
      'border': '2px solid#AFAFAF',
      'text-align': 'center',
      'padding-top': '13px',
      'color': '#777',
      'cursor': 'pointer',
    }).html('Close');

    // Close button action
    $('#' + self.viewCloseButtonID).click(function (e) {
      e.preventDefault();
      e.stopPropagation();

      if ($('#' + self.viewContainerID).is(':visible')) {
        $('#' + self.viewContainerID).fadeOut(self.viewFadeOutSpeed, function () {
          $('#' + self.viewContainerID).remove();
        });
        $('#' + self.viewOverlayID).fadeOut(self.viewFadeOutSpeed, function () {
          $('#' + self.viewOverlayID).remove();
        });
      }
    });

    // Copy to clipboard button
    $('<div/>', {id: self.viewCopyToCBButtonID}).appendTo('#' + self.viewContainerID);
    $('#' + self.viewCopyToCBButtonID).css({
      'display': 'block',
      'width': '200px',
      'height': '36px',
      'position': 'absolute',
      'top': '70px',
      'right': '10px',
      'border': '2px solid#AFAFAF',
      'text-align': 'center',
      'padding-top': '13px',
      'color': '#777',
      'cursor': 'pointer',
    }).html('Copy');

    // Copy to clipboard button action
    $('#' + self.viewCopyToCBButtonID).click(function (e) {
      e.preventDefault();
      e.stopPropagation();

      if ($('#' + self.viewContainerID).is(':visible')) {
        $('#' + self.viewContainerID + ' table').fadeOut(self.viewFadeOutSpeed, function () {
          $('#' + self.viewContainerID + ' table').remove();

          $('<textarea/>', {id: self.viewCopyToCBTextAreaID}).appendTo('#' + self.viewContainerID);
          $('#' + self.viewCopyToCBTextAreaID).css({
            'display': 'none',
            'width': '80%',
            'height': '80%'
          }).html(urlHTMLTextArea);

          $('#' + self.viewCopyToCBTextAreaID).fadeIn(self.viewFadeInSpeed, function () {
            $('#' + self.viewCopyToCBTextAreaID).select();
            $('#' + self.viewCopyToCBButtonID).fadeOut(self.viewFadeOutSpeed, function () {
              $('#' + self.viewCopyToCBButtonID).remove();
            });
          });
        });
      }
    });

    // Display result modal window
    $('#' + self.viewOverlayID).fadeIn(self.viewFadeInSpeed, function () {
      $('#' + self.viewContainerID).fadeIn(self.viewFadeInSpeed);
    });
    break;

  default:
    alert('YoutubeSubExporter - invalid content request');
  }
};

// ------------------------------------------------------------------
// Returns true|false - the state of the inProgress flag in the Local Storage
Exporter.prototype.isInProgress = function () {
  var self = this;
  var inPorgress = true;

  inPorgress = Boolean(localStorage.getItem(self.localStoragePrefix + 'in_progress'));

  return inPorgress;
};

// ------------------------------------------------------------------
// Sets the new inProgress state in the Local Storage
Exporter.prototype.setProgress = function (newState) {
  var self = this;

  localStorage.setItem(self.localStoragePrefix + 'in_progress', newState);
};

// ------------------------------------------------------------------
// Removes the inProgress state from the Local Storage
Exporter.prototype.removeProgress = function () {
  var self = this;

  localStorage.removeItem(self.localStoragePrefix + 'in_progress');
};

// ------------------------------------------------------------------
// Page load - fire up and use dat class
$(document).ready(function () {
  var exporter = new Exporter();

  if (exporter.isLocalStorageSupported()) {
    var $nextButton = exporter.getNextButton();

    if (!exporter.isInProgress()) {
      exporter.emptyUrls();
      exporter.setProgress(true);
    }

    exporter.updateUrls();

    if ($nextButton !== null) {
      window.setTimeout(exporter.goToNextPage, exporter.pagerTimeout, $nextButton);
    } else {
      exporter.showContent('result');
      exporter.emptyUrls();
      exporter.removeProgress();
    }

  } else {
    exporter.showContent('no_local_storage');
  }
});