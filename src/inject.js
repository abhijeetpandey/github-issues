try {
    (function () {

        var logger = false;

        function cAjax(obj) {
            return $.ajax({
                dataType: obj['dataType'] ? obj['dataType'] : "JSON",
                url: obj['url'],
                type: obj['type'] ? obj['type'] : "GET",
                data: obj['data'],
                retryCount: obj['retryCount'] ? obj['retryCount'] : 0,
                retryLimit: 10,
                success: function (data) {
                    if (typeof obj['success'] == 'function') {
                        obj['success'](data);
                    }
                    //todo:add loaders
                    //parent.set('loading', false);
                },
                error: function (data) {
                    if (data.status > 500 && this.retryCount < this.retryLimit) {
                        obj['retryCount'] = obj['retryCount'] ? obj['retryCount'] + 1 : 1;
                        setTimeout(function () {
                            cAjax(obj);
                        }, 2000);
                    } else {
                        if (typeof obj['error'] == 'function') {
                            obj['error'](data);
                        }
                    }
                }
            });
        }

        function fetch_issues_by_url(url, callback) {
            cAjax({
                url: url,
                dataType: 'html',
                success: function (data) {
                    var div = $("<div></div>");
                    div.html(data);
                    var issues = div.find('.table-list-issues').find('li');
                    var pages = div.find('.paginate-container').find('.pagination').find('a').length;
                    pages = isNaN(pages) ? 0 : pages;
                    var a = div.find('#js-issues-toolbar').find('.table-list-filters').find('.table-list-header-toggle.states.left').find('a');
                    var open = $(a[0]).text();
                    var closed = $(a[1]).text();
                    var full_data = {issues: issues, pages: pages, open: open, closed: closed};
                    if (logger) {
                        console.log(full_data);
                    }
                    callback(full_data);
                }
            });
        }

        function get_query_strings() {
            var query = window.location.search;
            var pathname = window.location.pathname;
            var query_strings = [];
            if (query.indexOf('assignee') >= 0) {
                query_strings.push(pathname + query);
                query_strings.push(pathname + query.replace('assignee', 'mentions'));
            } else if (pathname.indexOf('issues/assigned') >= 0 || pathname.indexOf('pulls/assigned') >= 0) {
                query_strings.push(pathname);
                query_strings.push(pathname.replace('assigned', 'mentioned'));
            }

            if (logger) {
                console.log(query_strings);
            }

            return query_strings
        }

        function build_issues_list(issues) {
            var ul = $('#custom_container');
            if (ul.length) {
                ul.html("");
            } else {
                var default_container = $($('.issues-listing').find('.table-list-issues')[0]);
                default_container.attr('id', 'default_container');
                var info_div = $('<div id="info_div" class="protip"></div>');
                ul = $('<ul id="custom_container" class="table-list table-list-bordered table-list-issues js-navigation-container js-active-navigation-container"></ul>');
                info_div.insertAfter('#js-issues-toolbar');
                ul.insertAfter('#info_div');
            }

            $.each(issues['issues'], function (key, value) {
                ul.append(value);
            });
            $('#info_div').text(issues['open'] + " , " + issues['closed']);
            ul.append(ul);

            if (logger) {
                console.log(ul);
            }

            $('#default_container').fadeOut();
            $('#custom_container').fadeIn();
            $('#info_div').fadeIn();
        }

        function get_issues() {
            $('#default_issues').show();
            $('#get_issues').hide();
            var query_strings = get_query_strings();
            if (query_strings.length > 1) {
                fetch_issues_by_url(query_strings[0], function (assigned_issues) {
                    fetch_issues_by_url(query_strings[1], function (mentioned_issues) {
                        var issues = $.merge(assigned_issues['issues'], mentioned_issues['issues']);
                        var all_issues = [];
                        var ids = [];
                        $.each(issues, function (key, value) {
                            if (!ids.hasOwnProperty(value.id)) {
                                ids[value.id] = true;
                                all_issues.push(value);
                            }
                        });
                        var pages = Math.max(assigned_issues['pages'], mentioned_issues['pages']);
                        var final_issues = {
                            issues: all_issues,
                            pages: pages,
                            open: 'Assigned:' + assigned_issues['open'] + ' | ' + 'Mentioned:' + mentioned_issues['open'],
                            closed: 'Assigned:' + assigned_issues['closed'] + ' | ' + 'Mentioned:' + mentioned_issues['closed']
                        };
                        ids = null;
                        if (logger) {
                            console.log(final_issues);
                        }
                        build_issues_list(final_issues);
                    });
                });
            } else {
                alert("Nothing to filter, you might have missed on selecting 'assignee'.");
                default_issues();
            }
        }

        function default_issues() {
            $('#get_issues').show();
            $('#default_issues').hide();
            $('#default_container').fadeIn();
            $('#custom_container').fadeOut();
            $('#info_div').fadeOut();
        }

        function init_() {
            var iss_ = $('#get_issues');
            if (!iss_.length) {
                $($('.table-list-header-toggle')[0]).append('<a id="get_issues" class="btn-link">Show Mentioned or Assigned</a>')
                $($('.table-list-header-toggle')[0]).append('<a id="default_issues" class="btn-link" style="display:none;">Show Default</a>')
                $('#get_issues').click(function () {
                    get_issues();
                });
                $('#default_issues').click(function () {
                    default_issues();
                });
            }
        }

        $(document).ready(function () {
            $('#start-of-content').append('<div style="display: none;" id="_logger"></div>');
            setInterval(function () {
                logger = $('#_logger').text();
                init_();
            }, 1000);
        });

        return $;
    })()
} catch (e) {
    console.log(e);
}
