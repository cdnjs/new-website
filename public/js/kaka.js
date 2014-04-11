// Kaka - The Embeddable Cookie Library
// Kaka was created for a purpose, and one purpose only. To add simple cookie support for libraries that need it!
// It does this with a simple unrestricted license. So change the code, the name (please!), and use it however you like!!
// https://github.com/comfirm/Kaka.js
var Kaka = window.Kaka = {};

Kaka.get = function(name){
      var cookies = {};
      var decodeComponent = decodeURIComponent;
      var data = (document.cookie || "").split("; ");

      for(var i=0;i<data.length;++i){
              var segments = data[i].split("=", 2);
              if(segments.length == 2){
                  if (!cookies[decodeComponent(segments[0])]) {
                      cookies[decodeComponent(segments[0])] = decodeComponent(segments[1]);
                  }
              }
      }

      return (name === undefined ? cookies : (name in cookies ? cookies[name] : null));
};

Kaka.set = function(name, value, expires, path){
      var variables = {};
      var encodeComponent = encodeURIComponent;

      variables[name] = value == undefined || value == null ? '' : value;
      variables['path'] = path || '/';

      if(expires && expires.toGMTString){
              variables["expires"] = expires.toGMTString();
      }

      var cookie = "";

      for(var key in variables){
              cookie += (cookie != "" ? "; " : "") + encodeComponent(key) + "=" + encodeComponent(variables[key]);
      }

      document.cookie = cookie;
};

Kaka.remove = function(name){
      Kaka.set(name, null, new Date(0));
};