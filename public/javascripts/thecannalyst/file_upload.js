/*jslint browser: true, devel: true, onevar: false, regexp: false, immed: false*/
/*global window: false, jQuery: false, $: false, Sugar: false, FB: false*/

(function ($S) {

    $S.FileUpload = function(tb, form) {
        this.tb = tb;
        this.exchangeForm = form;
        
        this.init();
    };
    
    $S.FileUpload.ENABLE_PLUGIN_ATTR    = 'data-tb-imageupload';
    $S.FileUpload.INLINE_VERSION_NAME   = 'md';


    // Handle system events
    $S.FileUpload.onSugarReady = function(evt) {
        $S.FileUpload.enhanceInlineImages();
    };
    $($S).bind('ready', $.proxy($S.FileUpload, 'onSugarReady'));
    
    $S.FileUpload.onSugarRichTextInit = function(evt, tb) {
        var form = $(tb.textArea).closest('form');
        if ($S.FileUpload.formUsePlugin(form)) {
            if (!$.isFunction(tb.fileUpload)) {
                tb.fileUpload = new $S.FileUpload(tb, form);
            } else {
                tb.fileUpload.addPostAssetsToFileList();
            }
        }
    };
    $($S).bind('richtextinit', $S.FileUpload.onSugarRichTextInit);

    
    // Class methods
    $S.FileUpload.formUsePlugin = function(form) {
        var usePlugin = form.attr($S.FileUpload.ENABLE_PLUGIN_ATTR);
        return (usePlugin === 'true' || usePlugin === '1');
    };
    
    $S.FileUpload.enhanceInlineImages = function() {
        // Add href around img to larger image if it does not already exists
        $('.post .content img[src^=/forum/images], .content img[src^=https?://s3.cannaimages.com]').each(function() {
            if ($(this).parent().is('a')) { return; }
            
            $(this).wrap($('<a>')
                    .attr('href', $(this).attr('src').replace($S.FileUpload.INLINE_VERSION_NAME + '_', ''))
                    .attr('data-hosted-image', true));
        });
    };
    
    
    // Public instance methods
    $S.FileUpload.prototype.init = function() {
        this.exchangeForm   = this.exchangeForm || $(this.tb.textArea).closest('form');
        // TODO get objectName from the from href or id
        this.objectName     = this.exchangeForm.find('input[name=object_name]').first().val();
        this.postId         = this.exchangeForm.find('input[name=post_id]').first().val();
        this.submitAfterUpload = false;
        
        this.imageUploadButtonName  = 'Image Upload';
        this.uploadContainerId      = 'image-upload-wrap-'  + this.exchangeForm.attr('id');
        this.filePickId             = 'file-pick-'          + this.exchangeForm.attr('id');
        
        this.setupInterface();
        this.initUploader();
        this.setupEvents();
        
        // Must hide after uploader is inited
        this.uploadContainer.hide();
    };
    
    $S.FileUpload.prototype.setupEvents = function() {
        // Uploader events
        this.uploader.bind('Init',          $.proxy(this.onUploaderInit, this));
        this.uploader.bind('FilesAdded',    $.proxy(this.onFilesAdded, this));
        this.uploader.bind('UploadProgress',$.proxy(this.onUploadProgress, this));
        this.uploader.bind('Error',         $.proxy(this.onUploadError, this));
        this.uploader.bind('FileUploaded',  $.proxy(this.onFileUploaded, this));
        this.uploader.bind('StateChanged',  $.proxy(this.onUploadStateChanged, this));

        this.exchangeForm.bind('submit', $.proxy(this.onFormSubmit, this));
        $($S).bind('livepostsuccess', $.proxy(this.onSugarLivePostSuccess, this));
        $(Sugar).bind('postsloaded', $.proxy(this.onSugarPostsLoaded, this));
    };
    
    $S.FileUpload.prototype.setupInterface = function() {
        this.addUploadedFilesArea();
        this.addUploadImageToolbarButton();
    };
    
    $S.FileUpload.prototype.resetForm = function() {
        // Close uploaded pane and reset interface
        $(this.tb.buttons).find('a.' + this.tb.getButtonName(this.imageUploadButtonName)).trigger('click');
        this.resetUploadedFilesArea();
        this.exchangeForm.find('.post_tmp_asset_ids').remove();
    };
    
    $S.FileUpload.prototype.initUploader = function() {
        this.uploader = new plupload.Uploader({
            runtimes : 'html5,flash,silverlight,browserplus',
            browse_button : this.filePickId,
            container : this.uploadContainerId,
            max_file_size : '70mb',
            url : this.exchangeForm.attr('action') + '/file_upload',
            flash_swf_url : '/javascripts/vendor/plupload/plupload.flash.swf',
            silverlight_xap_url : '/javascripts/vendor/plupload/plupload.silverlight.xap',
            filters : [
                {title : "Image files", extensions : "jpeg,jpg,gif,png"},
                {title : "Pdf files", extensions : "pdf"},
                {title : "Video files", extensions : "mov,m4v,avi,mp4"},
                // TODO virus scanning
                {title : "Other files", extensions : "doc,txt,docx,xls"},
                {title : "Zip files", extensions : "zip"}
            ],
            multipart: true,
            multipart_params: {
                "authenticity_token": Sugar.authToken(this.exchangeForm),
                post_id: this.postId ? this.postId : ''
            }
        });
        this.uploader.init();
    };
    
    $S.FileUpload.prototype.onUploaderInit = function(up, params) {
        // this.uploadContainer.html("<div>Current runtime: " + params.runtime + "</div>");
    };
    
    $S.FileUpload.prototype.onUploadStateChanged = function(up) {
    };
    
    $S.FileUpload.prototype.onUploadFilesClick = function(e) {
        this.uploader.start();
        e.preventDefault();
    };
    
    $S.FileUpload.prototype.onFilesAdded = function(up, files) {
        $.each(files, $.proxy(function(idx, file) {
            this.addFileToList(file);
        }, this));
        up.refresh(); // Reposition Flash/Silverlight
        this.uploader.start();
        
        this.uploadContainer.find(".uploadfiles").show();
    };
    
    $S.FileUpload.prototype.addFileToList = function(file) {
        this.uploadContainer.find('.filelist').prepend($('<div>')
            .addClass('file').attr('id', file.id)
            .html(file.name + ' (' + plupload.formatSize(file.size) + ')')
            .append('<span class="progress"><span class="inner"></span>')
        );
    };
    
    $S.FileUpload.prototype.addPostAssetsToFileList = function() {
        var postAssets = this.exchangeForm.find('.post_tmp_asset_ids');
        if (postAssets.length === 0) { return; }
        
        postAssets.each($.proxy(function(idx, asset) {
            this.addFileToList(asset);
        }, this));
        this.uploader.refresh();
    };
    
    $S.FileUpload.prototype.onUploadProgress = function(up, file) {
        // $('#' + file.id + " b").html(file.percent + "%");
        $('#' + file.id + " .progress .inner").css('width', file.percent + "%");
    };
    
    $S.FileUpload.prototype.onFileUploaded = function(up, file, res) {
        var response = $.parseJSON(res.response);
        
        // $('#' + file.id + " span").html("100%");
        $('#' + file.id + " .progress").hide();

        if ('image' === response.asset_type) {
            $('#' + file.id).append($('<a class="post-insert">').html('Insert into post'))
                .click($.proxy(function(evt) {
                    evt.preventDefault();
                    this.insertImageIntoTextArea(response);
                }, this));
        }
        
        // Insert hidden field with asset_id
        this.exchangeForm.prepend($("<input />")
            .attr("type","hidden")
            .addClass('post_tmp_asset_ids')
            .attr("name", this.objectName + '[tmp_asset_ids][]')
            .val(response._id)
        );

        // If we're waiting to submit the form until all the files are done uploading
        if (this.submitAfterUpload && this.uploadsFinished()) {
            this.exchangeFormSubmit();
            this.hideUploadingSpinner();
        }
    };
    
    $S.FileUpload.prototype.onUploadError = function(up, err) {
        this.uploadContainer.find('.filelist').prepend("<div>Error: " + err.code +
            ", Message: " + err.message +
            (err.file ? ", File: " + err.file.name : "") +
            "</div>"
        );
        up.refresh(); // Reposition Flash/Silverlight

        // this.hideUploadingSpinner();
    };
    
    $S.FileUpload.prototype.onFormSubmit = function(evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        
        // If there are files that have not been uploaded then upload and attach
        if (this.uploader.files.length > 0 && !this.uploadsFinished()) {
            this.showUploadingSpinner();

            // handler will submit the form once the files have finished
            this.uploader.start();
            this.submitAfterUpload = true;
        } else {
            this.exchangeFormSubmit($(evt.target));
        }
    };
    
    $S.FileUpload.prototype.exchangeFormSubmit = function(form) {
        if (form.hasClass('livePost')) {
            Sugar.parseSubmit();
        } else {
            // Kill the hanlder, as we just want to process a normal submit
            this.exchangeForm.unbind('submit');
            this.exchangeForm.submit();
        }
    };
    
    $S.FileUpload.prototype.onSugarLivePostSuccess = function(evt, submitForm) {
        // $S.FileUpload.enhanceInlineImages.delay(1000);
        this.resetForm();
    };

    $S.FileUpload.prototype.onSugarPostsLoaded = function(evt) {
        $S.FileUpload.enhanceInlineImages();
    };
    
    $S.FileUpload.prototype.addUploadedFilesArea = function(tb) {
        var container = document.createElement('div');
        this.uploadContainer = $(container).attr('id', this.uploadContainerId).addClass('upload-files-cont')
            .insertAfter(this.tb.listElement)
            .append('<div class="filelist">')
            .append('<a id="' + this.filePickId + '" class="file-pick" href="#">Attach or upload file..</a>');

        this.uploadContainer.find('.uploadfiles').hide()
            .click($.proxy(this.onUploadFilesClick, this));
    };

    $S.FileUpload.prototype.resetUploadedFilesArea = function(tb) {
        this.uploadContainer.find('.filelist .file').remove();
        this.uploadContainer.find('.uploadfiles').hide();
    };
    
    $S.FileUpload.prototype.addUploadImageToolbarButton = function() {
        this.tb.addButton(this.imageUploadButtonName, $.proxy(this.onButtonClick, this));
    };
    
    $S.FileUpload.prototype.onButtonClick = function(evt) {
        $(evt.target).toggleClass('active');
        this.uploadContainer.toggle();
        // If container is shown then show upload form
        // $('#' + this.filePickId).trigger('click');
    };
    
    $S.FileUpload.prototype.uploadsFinished = function() {
        return this.uploader.total.uploaded == this.uploader.files.length;
    };

    $S.FileUpload.prototype.insertImageIntoTextArea = function(fileInfo) {
        var selection = this.tb.textArea.selectedText();
        this.tb.textArea.replaceSelection($('<div>').append(
            $('<img>').attr('src', fileInfo.inline_post_url)
                      .attr('alt', fileInfo.name)
                      .clone()).remove().html()
        );
    };
    
    $S.FileUpload.prototype.showUploadingSpinner = function() {
        this.statusField = $('#button-container');
        this.oldPostButton = this.statusField.html();
        this.statusField.addClass('posting');
        this.statusField.html('Posting..');
    };
    
    $S.FileUpload.prototype.hideUploadingSpinner = function() {
        this.statusField.each(function () {
            $(this).removeClass('posting');
            $(this).html(this.oldPostButton);
        });
    };
    
})(Sugar);