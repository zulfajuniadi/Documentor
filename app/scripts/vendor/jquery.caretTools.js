$.fn.caret = function(begin, end) {
    if (this.length == 0) return;
    if (typeof begin == 'number') {
        end = (typeof end == 'number') ? end : begin;
        return this.each(function() {
            if (this.setSelectionRange) {
                this.setSelectionRange(begin, end);
            } else if (this.createTextRange) {
                var range = this.createTextRange();
                range.collapse(true);
                range.moveEnd('character', end);
                range.moveStart('character', begin);
                try {
                    range.select();
                } catch (ex) {}
            }
        });
    } else {
        if (this[0].setSelectionRange) {
            begin = this[0].selectionStart;
            end = this[0].selectionEnd;
        } else if (document.selection && document.selection.createRange) {
            var range = document.selection.createRange();
            begin = 0 - range.duplicate().moveStart('character', -100000);
            end = begin + range.text.length;
        }
        return {
            begin: begin,
            end: end
        };
    }
}

function getCaretSelection(field) {
    var start = field.selectionStart;
    var end = field.selectionEnd;
    return sel = field.value.substring(start, end) || '';
}

$.fn.insertAtCaret = function(beforeText, afterText) {
    var field = this[0];
    var beforeText = beforeText || '';
    var afterText = afterText || '';

    var sel = getCaretSelection(field);

    if(sel === '') {
        beforeText = "\n" + beforeText;
        afterText = afterText + "\n";
    }

    //IE support

    if (document.selection) {
        field.focus();
        sel = document.selection.createRange();
        sel.text = beforeText + sel + afterText;
    }

    //MOZILLA and others
    else if (field.selectionStart || field.selectionStart == '0') {
        var startPos = field.selectionStart;
        var endPos = field.selectionEnd;
        field.value = field.value.substring(0, startPos)
            + beforeText + sel + afterText
            + field.value.substring(endPos, field.value.length);
    } else {
        field.value += beforeText + sel + afterText;
    }

}