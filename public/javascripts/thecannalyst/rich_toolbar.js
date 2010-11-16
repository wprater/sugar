(function ($S) {
    
    // Remove unwanted buttons from the RichTextArea Toolbar
    $($S).bind('ready', function () {
        if ($(Sugar.ta).length > 0) {
            $('ul.' + Sugar.ta.toolbar.settings.className + ' .EscapeHTMLButton').parent('li').remove();
        }
    });
    
})(Sugar);