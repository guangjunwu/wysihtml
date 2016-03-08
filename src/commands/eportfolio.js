(function(wysihtml5) {
  var api = wysihtml5.dom;
	
  function expendToWord(sel){
	var sel = rangy.getSelection();
	sel.expand("word", {trim: true, wordOptions: {wordRegex: /[0-9a-z\u00E0-\u00FC]+/gi}});
	if(sel.isCollapsed){
		sel.move("character", -1);
		sel.expand("word", {trim: true, wordOptions: {wordRegex: /[0-9a-z\u00E0-\u00FC]+/gi}});
	}
  }
  
  function selectFirstChar(){
	var sel = rangy.getSelection();
	expendToWord(sel);
	
	if(!sel.isCollapsed){
		var range = sel._ranges[0]; 
		range.collapse(true);
		range.moveEnd("character", 1);
		sel.removeAllRanges();
		sel.addRange(range);
		return true; // first char selected
	}
	return false;
  }
  function selectLastChar(){
	var sel = rangy.getSelection();
	expendToWord(sel);
	if(!sel.isCollapsed){
		var range = sel._ranges[0]; 
		range.collapse(false);
		range.moveStart("character", -1);
		sel.removeAllRanges();
		sel.addRange(range);
		return true; // last char selected
	}
	return false;
  }

  function selectSingleChar(className){
	var p = getClassProperties(className);
	
	if(p.before) 
		return selectFirstChar();
	else 
		return selectLastChar();
  }
  
  function getClassProperties(className){
	  var prefix = "epf_pre_"; 
	  var before = true;
	  if(className.indexOf("epf_post_") >= 0) {
		  prefix = "epf_post_";
		  before = false;
	  }
	  return {prefix: prefix, before: before};
  }
  
  // function copied from wysihtml lib
  function getSelectedTextNodes(selection, splitBounds) {
    var textNodes = [];

    if (!selection.isCollapsed()) {
      textNodes = textNodes.concat(selection.getOwnNodes([3], function(node) {
        // Exclude empty nodes except caret node
        return (!wysihtml5.dom.domNode(node).is.emptyTextNode());
      }, splitBounds));
    }

    return textNodes;
  }  
  
  
  wysihtml5.commands.eportfolio = {
    exec: function(composer, command, eportfolioClass) {
      //remember the original selection
      // if this reset original selection logic doesn't work for some reason, 
      // think about move eportfolio logic into wysihtml-toolbar.js
      var sel = rangy.getSelection(composer.win);
      var clonedNativeRange = sel._ranges[0].nativeRange.cloneRange();

      if(!selectSingleChar(eportfolioClass)) return; // no char selected, do nothing.

      var textNodes = getSelectedTextNodes(composer.selection, false); // don't split bounds, after all, the selection contains only one char
      var spanClasses = [];
      if(textNodes && textNodes.length > 0){
    	  var parentNode = textNodes[0].parentNode;
    	  if(parentNode && parentNode.nodeName == "SPAN"){
    		  for(i=0; i<parentNode.attributes.length; i++){
    			  var attr = parentNode.attributes[i];
    			  if(attr.name == "class"){
    				  spanClasses = attr.value.split(" ");
    				  break;
    			  }
    		  }
    	  }
      }
      
      if(spanClasses.length > 0){
    	  var formatApplied = false;
    	  for(i=0; i<spanClasses.length; i++){
    		  if(spanClasses[i] == eportfolioClass){
    			  formatApplied = true;
    			  break;
    		  }
    	  }
    	  
    	  var epfClass = eportfolioClass.substring(eportfolioClass.lastIndexOf("_"));
    	  if(formatApplied){
        	  for(i=0; i<spanClasses.length; i++){
        		  if(spanClasses[i].indexOf(epfClass) >= 0){
        			  wysihtml5.commands.formatInline.exec(composer, command, {className: spanClasses[i], nodeName: "SPAN", toggle: true});
        		  }
        	  }
    	  } else {
        	  for(i=0; i<spanClasses.length; i++){
       			  wysihtml5.commands.formatInline.exec(composer, command, {className: spanClasses[i] + epfClass, nodeName: "SPAN", toggle: true});
        	  }
        	  wysihtml5.commands.formatInline.exec(composer, command, {className: eportfolioClass, nodeName: "SPAN", toggle: true});
    	  }
    	  
      } else {
          wysihtml5.commands.formatInline.exec(composer, command, {className: eportfolioClass, nodeName: "SPAN", toggle: true});
      }
      
      // reset the original selection
      // this doesn't work very well. when toggle an annotation, a new element span might be inserted, 
      // this change the underline content, it's hard to get the same selection.
      // need more work if it's necessary
      sel.removeAllRanges();
	  sel.nativeSelection.addRange(clonedNativeRange);
	  sel.refresh();

      //sync();
    },
    
    // depends on the return value of this function, the corresponding button on tool bar will be active or not
    state: function(composer, command, eportfolioClass) {
      //remember the original selection
      // if this reset original selection logic doesn't work for some reason, 
      // think about move eportfolio logic into wysihtml-toolbar.js
      // 
      var sel = rangy.getSelection(composer.win); 
      var clonedNativeRange = sel._ranges[0].nativeRange.cloneRange();
      
      // test the state according the single char selection logic
      selectSingleChar(eportfolioClass);
      nodes = wysihtml5.commands.formatInline.state(composer, command, {className: eportfolioClass, nodeName: "SPAN"});
	  
      // reset the original selection
      sel.removeAllRanges();
	  sel.nativeSelection.addRange(clonedNativeRange);
	  sel.refresh();
      
	  // return the state
	  if(nodes && api.hasClass(nodes[0], eportfolioClass)){
    	  return nodes;
      } else {
    	  return false;
      }
    }
  };
})(wysihtml5);