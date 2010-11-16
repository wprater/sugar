(function ($S) {
    
    // Remove unwanted buttons from the RichTextArea Toolbar
    $($S).bind('ready', function () {
        if ($(Sugar.ta).length > 0) {
            Sugar.ta.toolbar.removeButton('Escape HTML');
        }
    });
    
})(Sugar);