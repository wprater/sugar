(function ($S) {
    
    // Remove unwanted buttons from the RichTextArea Toolbar
    $($S).bind('ready', function () {
        $('ul.' + Sugar.ta.toolbar.settings.className + ' .EscapeHTMLButton').parent('li').remove();
    });
    
})(Sugar);