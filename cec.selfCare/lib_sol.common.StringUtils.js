
//@include lib_Class.js

/**
 * This class contains convinience methods for working with strings.
 *
 * Works transparently with Java and JavaScript Strings
 *
 * @author PZ, ELO Digital Office GmbH
 * @version 1.0
 *
 * @eloall
 */
sol.define("sol.common.StringUtils", {
  singleton: true,

  /**
   * Returns a formatted string.
   * The first parameter contains the String which should be formatted.
   * This parameter is followed by an arbitary number uf strings, which will be used to replace the placefolders.
   *
   * # Examples
   *
   *     sol.common.StringUtils.format("Hello {0}!", "world");
   *
   *     sol.common.StringUtils.format("An error occurred writing object {0} to database. Exception was: {1}", objId, ex);
   *
   *     sol.common.StringUtils.format("Value of {0} updated: {1} -> {2}", key, oldValue, newValue);
   *
   * @param {String} str String which should be formated, containing placeholders
   * @return {String}
   */
  format: function (str) {
    var args = Array.prototype.slice.call(arguments, 1);

    return str.replace(/\{(\d+)\}/g, function (match, number) {
      return (typeof args[number] !== "undefined") ? args[number] : match;
    });
  },

  /**
   * Checks, if a string starts with another string
   * @param {String} str
   * @param {String} pattern
   * @returns {Boolean}
   */
  startsWith: function (str, pattern) {
    return str.indexOf(pattern) === 0;
  },

  /**
   * Checks, if a string ends with another string
   * @param {String} str
   * @param {String} pattern
   * @returns {Boolean}
   */
  endsWith: function (str, pattern) {
    var postfixLength;
    str += "";
    pattern += "";
    postfixLength = (pattern.length < str.length) ? pattern.length : str.length;
    return str.indexOf(pattern) === (str.length - postfixLength);
  },

  /**
   * Checks, if a string contains another string
   * @param {String} str
   * @param {String} pattern
   * @returns {Boolean}
   */
  contains: function (str, pattern) {
    return str.indexOf(pattern) !== -1;
  },

  /**
   * Checks, if a string has a numeric value
   * @param {String} str
   * @returns {Boolean}
   */
  isNumeric: function (str) {
    return (!isNaN(parseFloat(str)) && isFinite(str));
  },

  /**
   * Checks, if a string is not defined/null or empty
   * @param {String} str
   * @returns {Boolean}
   */
  isEmpty: function (str) {
    if (!str) {
      return true;
    }
    str += "";
    return (str.length <= 0);
  },

  /**
   * Checks, if a string is not defined/null, empty or contains only whitespaces
   * @param {String} str
   * @returns {Boolean}
   */
  isBlank: function (str) {
    return !str || this.isEmpty(str.trim());
  },

  /**
   * Pads a string at the left side
   * @param {String|Number} str Input string
   * @param {Number} length Destination length of the string
   * @param {String} [padString="0"] (optional) Padding string
   * @return {String} Padded string
   */
  padLeft: function (str, length, padString) {
    str += "";
    padString = padString || "0";
    while (str.length < length) {
      str = padString + str;
    }
    return str;
  },

  /**
   * Pads a string at the right side
   * @param {String|Number} str Input string
   * @param {Number} length Destination length of the string
   * @param {String} [padString="0"] (optional) Padding string
   * @return {String} Padded string
   */
  padRight: function (str, length, padString) {
    str += "";
    padString = padString || "0";
    while (str.length < length) {
      str += padString;
    }
    return str;
  },

  /**
   * Replaces every occurrence of a substring with another string
   * @param {String} str Input string
   * @param {String} target String to replace
   * @param {String} replacement Replacement string
   * @returns {String} Padded string
   */
  replaceAll: function (str, target, replacement) {
    return String(str).split(target).join(replacement);
  },

  /**
   * Returns the trailing number string
   * @param {String} str Input string
   * @return {String} Number string
   */
  getTrailingNumber: function (str) {
    var match = String(str).match(/\d+$/);
    if (match && (match.length > 0)) {
      return parseInt(match[0], 10);
    }
  },

  /**
   * Removes the trailing number
   * @param {String} str Input string
   * @return {String} Number string
   */
  removeTrailingNumber: function (str) {
    return String(str).replace(/\d+$/, "");
  },

  /**
   * Removes line breaks
   * @param {String} str Input string
   * @param {Object} config Configuration
   * @param {String} config.replaceString Replace string
   * @return {String}
   */
  replaceLineBreaks: function (str, config) {
    config = config || {};
    config.replaceString = config.replaceString || " ";
    return String(str).replace(/\r?\n|\r/g, config.replaceString);
  },

  /**
   * Splits a string into lines
   * @param {String} text Text
   * @return {Array} lines
   */
  splitLines: function (text) {
    var lines;
    text = text || "";
    lines = text.split(/\r\n|\n|\r/);
    return lines;
  },

  /**
   * Parses an INI string
   * @param {String} iniString INI file content
   * @return {Object} Object
   */
  parseIniString: function (iniString) {
    var regex,
        obj = {},
        lines, section, match;

    regex = {
      section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
      param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
      comment: /^\s*;.*$/
    };

    lines = iniString.split(/[\r\n]+/);
    lines.forEach(function (line) {
      if (!regex.comment.test(line)) {
        if (regex.param.test(line)) {
          match = line.match(regex.param);
          if (section) {
            obj[section][match[1]] = match[2];
          } else {
            obj[match[1]] = match[2];
          }
        } else if (regex.section.test(line)) {
          match = line.match(regex.section);
          obj[match[1]] = {};
          section = match[1];
        } else if (line.length == 0 && section) {
          section = null;
        }
      }
    });
    return obj;
  },

  /**
   * Remove quotes
   * @param {String} str
   * @return {String} String without quotes
   */
  removeQuotes: function (str) {
    var firstChar, lastChar;
    str += "";
    if (str && (str.length > 1)) {
      firstChar = str.charAt(0);
      lastChar = str.charAt(str.length - 1);
      if ((firstChar == '"' && lastChar == '"') || (firstChar == "'" && lastChar == "'")) {
        if (str.length > 2) {
          str = str.substr(1, str.length - 2);
        } else {
          str = "";
        }
      }
    }
    return str;
  }
});

//# sourceURL=lib_sol.common.StringUtils.js