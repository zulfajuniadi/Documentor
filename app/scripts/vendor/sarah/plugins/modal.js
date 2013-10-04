;(function(Sarah){
    function run() {
        Sarah.Modal = function(){
            $('body').append('<div class="modal fade" id="modal"><div class="modal-header" id="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h3 id="modal-title">Modal header</h3></div><div id="modal-body"></div>');
            return this;
        };

        Sarah.Modal.prototype.setTitle = function(title) {
            $('#modal-title').html(title);
            return this;
        }

        Sarah.Modal.prototype.setBody = function(template, data) {
            var data = data || {};
            if(typeof Template[template] !== 'undefined') {
                $('#modal-body').html(Template[template].render(data));
            }
            return this;
        }

        Sarah.Modal.prototype.reset = function(template, data) {
            var data = data || {};
            if(typeof Template[template] !== 'undefined') {
                $('#modal-header').empty();
                $('#modal-title').empty();
            }
            return this;
        }

        Sarah.Modal.prototype.show = function(options){
            if(options) {
                if(options.title){
                    this.setTitle(options.title);
                }
                if(options.template) {
                    options.data = options.data || {};
                    this.setBody(options.template, options.data);
                }
            }
            $('#modal').modal('show');
        }

        Sarah.Modal.prototype.hide = function(){
            $('#modal').modal('hide');
        }

        window.Modal = new Sarah.Modal();

        Sarah.Runtime.Loaded['modal.js'] = true;
    }

    run();
})(Sarah);


