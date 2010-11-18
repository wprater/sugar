/*jslint browser: true, devel: true, onevar: false, regexp: false, immed: false*/
/*global window: false, jQuery: false, $: false, Sugar: false, FB: false*/

(function ($S) {

    $($S).bind('ready', function(evt) {
        // Add href around img to larger image
        $('.body img.inline-image').each(function() {
            $(this).wrap($('<a>')
                .attr('href', 
                $(this).attr('src').replace('inline_post_', '')));
        });
    });
    
    // Evey time an RichText widget is built, we attach ourselves to it
    $($S).bind('richtextinit', function(evt, tb) {
        if (!$.isFunction(tb.fileUpload)) {
            tb.fileUpload = new $S.FileUpload(tb);
        }
    });
    
    // Listen for live posts and reset form 
    $($S).bind('livepostsuccess', function(evt, submitForm) {
        $(submitForm).find('textarea.rich').each(function () {
            this.toolbar.fileUpload.resetForm();
        });
    });
    
    
    $S.FileUpload = function(tb) {
        this.tb = tb;
        
        this.init();
    };
    
    $S.FileUpload.prototype.init = function() {
        this.exchangeForm   = $(this.tb.textArea).closest('form');
        this.objectName     = this.exchangeForm.find('input[name=object_name]')[0].value;
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
        $.each(files, $.proxy(function(i, file) {
            this.uploadContainer.find('.filelist').prepend($('<div>')
                .addClass('file').attr('id', file.id)
                .html(file.name + ' (' + plupload.formatSize(file.size) + ')')
                .append('<span class="progress"><span class="inner"></span>')
            );
        }, this));
        up.refresh(); // Reposition Flash/Silverlight
        this.uploader.start();
        
        this.uploadContainer.find(".uploadfiles").show();
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
                    this.insertImageIntoTextArea(response)
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
            this.exchangeFormSubmit();
        }
    };
    
    $S.FileUpload.prototype.exchangeFormSubmit = function() {
        if ($("#replyText form").length > 0) {
            Sugar.parseSubmit();
        } else {
            // Kill the hanlder, as we just want to process a normal submit
            this.exchangeForm.unbind('submit');
            this.exchangeForm.submit();
        }
    }
    
    $S.FileUpload.prototype.addUploadedFilesArea = function(tb) {
        var container = document.createElement('div');
        this.uploadContainer = $(container).attr('id', this.uploadContainerId).addClass('upload-files-cont')
            .insertAfter(this.tb.listElement)
            .append('<div class="filelist" />')
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
    };
    
    $S.FileUpload.prototype.uploadsFinished = function() {
        return this.uploader.total.uploaded == this.uploader.files.length;
    };

    $S.FileUpload.prototype.insertImageIntoTextArea = function(fileInfo) {
        var selection = this.tb.textArea.selectedText();
        this.tb.textArea.replaceSelection($('<div>').append(
            $('<img>').attr('src', fileInfo.inline_post_url)
                      .attr('alt', fileInfo.name)
                      .addClass('inline-image').clone()).remove().html()
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