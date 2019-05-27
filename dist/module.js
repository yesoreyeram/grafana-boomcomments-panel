System.register(["lodash", "app/plugins/sdk"], function (exports_1, context_1) {
    "use strict";
    var __extends = (this && this.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var lodash_1, sdk_1, PLUGIN_ID, CONFIG, BoomCommentsCtl, getTooltipMessage, sortAndSliceComments, getPanelStyle;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (sdk_1_1) {
                sdk_1 = sdk_1_1;
            }
        ],
        execute: function () {
            PLUGIN_ID = "yesoreyeram-boomcomments-panel";
            CONFIG = {
                comment_postbox_positions: [
                    { text: "Top", value: "top" },
                    { text: "Bottom", value: "bottom" },
                ],
                comment_tag: "boom-comment",
                comments_order: [
                    { text: "New Comments at Top", value: "new_comments_at_top" },
                    { text: "New Comments at Bottom", value: "new_comments_at_bottom" },
                ],
                cssThemes: {
                    dark: "plugins/" + PLUGIN_ID + "/css/default.dark.css",
                    light: "plugins/" + PLUGIN_ID + "/css/default.light.css"
                },
                default_templateURL: "partials/module.html",
                editorTabs: [
                    {
                        position: 2,
                        templatePath: "public/plugins/" + PLUGIN_ID + "/partials/options.html",
                        title: "Panel Options"
                    }
                ],
                grafana_events: {
                    dataReceived: "data-received",
                    initEditMode: "init-edit-mode",
                    panelTeardown: "panel-teardown",
                    refresh: "refresh",
                    render: "render"
                }
            };
            sdk_1.loadPluginCss(CONFIG.cssThemes);
            BoomCommentsCtl = (function (_super) {
                __extends(BoomCommentsCtl, _super);
                function BoomCommentsCtl($scope, $injector, $http, backendSrv) {
                    var _this = _super.call(this, $scope, $injector) || this;
                    _this.raw_comments = [];
                    _this.comments = [];
                    _this.activeEditorTabIndex = -2;
                    _this.comment_postbox_positions = CONFIG.comment_postbox_positions;
                    _this.comments_order = CONFIG.comments_order;
                    _this.panelDefaults = {
                        comment_postbox_position: "bottom",
                        comment_tag: CONFIG.comment_tag,
                        comments_order: "new_comments_at_top",
                        enable_inline_commentbox: false,
                        highlight_newComments: true,
                        highlight_newComments_color: "yellow",
                        highlight_newComments_minutes: 3,
                        number_of_comments_to_show: 5,
                        refresh_frequency: 10
                    };
                    lodash_1.default.defaultsDeep(_this.panel, _this.panelDefaults);
                    _this.$http = $http;
                    _this.backendSrv = backendSrv;
                    _this.events.on(CONFIG.grafana_events.initEditMode, _this.onInitEditMode.bind(_this));
                    _this.events.on(CONFIG.grafana_events.panelTeardown, _this.onPanelTeardown.bind(_this));
                    _this.events.on(CONFIG.grafana_events.refresh, _this.refreshComments.bind(_this));
                    _this.events.on(CONFIG.grafana_events.render, _this.refreshComments.bind(_this));
                    _this.refreshComments();
                    return _this;
                }
                BoomCommentsCtl.prototype.onPanelTeardown = function () {
                    this.$timeout.cancel(this.nextTickPromise);
                };
                BoomCommentsCtl.prototype.onInitEditMode = function () {
                    var _this = this;
                    lodash_1.default.each(CONFIG.editorTabs, function (editorTab) {
                        _this.addEditorTab(editorTab.title, editorTab.templatePath, editorTab.position);
                    });
                };
                BoomCommentsCtl.prototype.addComment = function () {
                    var _this = this;
                    if (this.ctrl.comment_text && this.ctrl.comment_text !== "") {
                        var commentOptions_1 = {
                            "tags": [this.ctrl.panel.comment_tag],
                            "text": "" + this.ctrl.comment_text
                        };
                        if (this.ctrl.comment_tags && this.ctrl.comment_tags !== "") {
                            lodash_1.default.each(this.ctrl.comment_tags.split(";").map(function (t) { return t.trim(); }), function (tag) {
                                commentOptions_1.tags.push(tag);
                            });
                        }
                        if (this.ctrl.comment_bgColor && this.ctrl.comment_bgColor !== "") {
                            commentOptions_1.tags.push("boom-bgcolor=" + this.ctrl.comment_bgColor);
                        }
                        if (this.ctrl.comment_textColor && this.ctrl.comment_textColor !== "") {
                            commentOptions_1.tags.push("boom-color=" + this.ctrl.comment_textColor);
                        }
                        if (this.ctrl.comment_fontSize && this.ctrl.comment_fontSize !== "") {
                            commentOptions_1.tags.push("boom-fontsize=" + (this.ctrl.comment_fontSize || "100"));
                        }
                        this.backendSrv.post('/api/annotations', commentOptions_1).then(function (response) {
                            console.log("Comment added", response);
                            _this.ctrl.comment_text = "";
                            _this.ctrl.comment_tags = "";
                            _this.ctrl.comment_bgColor = "";
                            _this.ctrl.comment_textColor = "";
                            _this.ctrl.comment_fontSize = "";
                            _this.refreshComments();
                        });
                    }
                };
                BoomCommentsCtl.prototype.refreshComments = function () {
                    var _this = this;
                    this.$timeout.cancel(this.nextTickPromise);
                    this.backendSrv.get("/api/annotations?tags=boom-comment&limit=" + (this.panel.number_of_comments_to_show || 10)).then(function (annotations) {
                        _this.raw_comments = annotations;
                        _this.render();
                    });
                    this.nextTickPromise = this.$timeout(this.refreshComments.bind(this), this.panel.refresh_frequency * 1000);
                };
                BoomCommentsCtl.prototype.link = function (scope, elem, attrs, ctrl) {
                    this.scope = scope;
                    this.elem = elem;
                    this.attrs = attrs;
                    this.ctrl = ctrl;
                };
                BoomCommentsCtl.templateUrl = CONFIG.default_templateURL;
                return BoomCommentsCtl;
            }(sdk_1.PanelCtrl));
            exports_1("PanelCtrl", BoomCommentsCtl);
            getTooltipMessage = function (annotation) {
                return "\n" + annotation.text + "\n\nMessage by : " + annotation.login + " (" + annotation.email + ")\nCreated at : " + new Date(annotation.created) + "\nUpdated at : " + new Date(annotation.updated) + "\nTags : " + annotation.tags.join(", ") + "\n  ";
            };
            sortAndSliceComments = function (raw_comments, sort_order, elementsToReturn) {
                var sorted_comments = lodash_1.default.sortBy(raw_comments, [function (o) { return o.time; }]);
                if (sort_order === "new_comments_at_top") {
                    sorted_comments = lodash_1.default.sortBy(sorted_comments, [function (o) { return -1 * o.time; }]);
                }
                else if (sort_order === "new_comments_at_bottom") {
                    sorted_comments = lodash_1.default.sortBy(sorted_comments, [function (o) { return o.time; }]);
                }
                return lodash_1.default.take(sorted_comments, elementsToReturn);
            };
            getPanelStyle = function (highlight_newComments_color) {
                return "\n    @keyframes blinkbg {\n        50% {\n            background-color: " + (highlight_newComments_color || "white") + ";\n            color: black;\n        }\n    }\n  ";
            };
            BoomCommentsCtl.prototype.render = function () {
                var _this = this;
                var panelStyle = getPanelStyle(this.ctrl.panel.highlight_newComments_color);
                var style = document.createElement('style');
                style.type = 'text/css';
                style.appendChild(document.createTextNode(panelStyle));
                this.elem.find("#boom-comments-style").html("");
                this.elem.find("#boom-comments-style").append(style);
                this.comments = [];
                this.raw_comments = sortAndSliceComments(this.raw_comments, this.panel.comments_order, +(this.ctrl.panel.number_of_comments_to_show));
                lodash_1.default.each(this.raw_comments, function (annotation) {
                    var comment = annotation;
                    comment.displayText = "" + annotation.text;
                    comment.displayTitle = getTooltipMessage(annotation);
                    comment.date = new Date(annotation.created);
                    var display_comment_classes = [];
                    if (_this.ctrl.panel.highlight_newComments === true && comment.created > ((new Date()).getTime() - (_this.ctrl.panel.highlight_newComments_minutes * 60 * 1000))) {
                        display_comment_classes.push("blink-comment");
                    }
                    comment.displayClass = display_comment_classes.join(" ");
                    comment.inlinestyle = {};
                    lodash_1.default.each(comment.tags, function (tag) {
                        if (tag.trim().toLowerCase().startsWith("boom-bgcolor=") === true) {
                            comment.inlinestyle.background = tag.trim().toLowerCase().replace("boom-bgcolor=", "");
                        }
                        else if (tag.trim().toLowerCase().startsWith("boom-color=") === true) {
                            comment.inlinestyle.color = tag.trim().toLowerCase().replace("boom-color=", "");
                        }
                        else if (tag.trim().toLowerCase().startsWith("boom-fontsize=") === true) {
                            comment.inlinestyle["font-size"] = tag.trim().toLowerCase().replace("boom-fontsize=", "") + "%";
                        }
                    });
                    _this.comments.push(comment);
                });
            };
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7WUFLSSxTQUFTLEdBQUcsZ0NBQWdDLENBQUM7WUFFM0MsTUFBTSxHQUFHO2dCQUNiLHlCQUF5QixFQUFFO29CQUN6QixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRTtvQkFDN0IsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUU7aUJBQ3BDO2dCQUNELFdBQVcsRUFBRSxjQUFjO2dCQUMzQixjQUFjLEVBQUU7b0JBQ2QsRUFBRSxJQUFJLEVBQUUscUJBQXFCLEVBQUUsS0FBSyxFQUFFLHFCQUFxQixFQUFFO29CQUM3RCxFQUFFLElBQUksRUFBRSx3QkFBd0IsRUFBRSxLQUFLLEVBQUUsd0JBQXdCLEVBQUU7aUJBQ3BFO2dCQUNELFNBQVMsRUFBRTtvQkFDVCxJQUFJLEVBQUUsYUFBVyxTQUFTLDBCQUF1QjtvQkFDakQsS0FBSyxFQUFFLGFBQVcsU0FBUywyQkFBd0I7aUJBQ3BEO2dCQUNELG1CQUFtQixFQUFFLHNCQUFzQjtnQkFDM0MsVUFBVSxFQUFFO29CQUNWO3dCQUNFLFFBQVEsRUFBRSxDQUFDO3dCQUNYLFlBQVksRUFBRSxvQkFBa0IsU0FBUywyQkFBd0I7d0JBQ2pFLEtBQUssRUFBRSxlQUFlO3FCQUN2QjtpQkFDRjtnQkFDRCxjQUFjLEVBQUU7b0JBQ2QsWUFBWSxFQUFFLGVBQWU7b0JBQzdCLFlBQVksRUFBRSxnQkFBZ0I7b0JBQzlCLGFBQWEsRUFBRSxnQkFBZ0I7b0JBQy9CLE9BQU8sRUFBRSxTQUFTO29CQUNsQixNQUFNLEVBQUUsUUFBUTtpQkFDakI7YUFDRixDQUFDO1lBR0YsbUJBQWEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7O2dCQUVGLG1DQUFTO2dCQThCckMseUJBQVksTUFBTSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsVUFBVTtvQkFBaEQsWUFFRSxrQkFBTSxNQUFNLEVBQUUsU0FBUyxDQUFDLFNBYXpCO29CQW5DTSxrQkFBWSxHQUFVLEVBQUUsQ0FBQztvQkFDekIsY0FBUSxHQUFVLEVBQUUsQ0FBQztvQkFDckIsMEJBQW9CLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQzFCLCtCQUF5QixHQUFHLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQztvQkFDN0Qsb0JBQWMsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDO29CQUV2QyxtQkFBYSxHQUFHO3dCQUVyQix3QkFBd0IsRUFBRSxRQUFRO3dCQUNsQyxXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVc7d0JBQy9CLGNBQWMsRUFBRSxxQkFBcUI7d0JBQ3JDLHdCQUF3QixFQUFFLEtBQUs7d0JBQy9CLHFCQUFxQixFQUFFLElBQUk7d0JBQzNCLDJCQUEyQixFQUFFLFFBQVE7d0JBQ3JDLDZCQUE2QixFQUFFLENBQUM7d0JBQ2hDLDBCQUEwQixFQUFFLENBQUM7d0JBQzdCLGlCQUFpQixFQUFFLEVBQUU7cUJBRXRCLENBQUM7b0JBS0EsZ0JBQUMsQ0FBQyxZQUFZLENBQUMsS0FBSSxDQUFDLEtBQUssRUFBRSxLQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7b0JBRS9DLEtBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO29CQUNuQixLQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztvQkFFN0IsS0FBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsS0FBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSSxDQUFDLENBQUMsQ0FBQztvQkFDbkYsS0FBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxhQUFhLEVBQUUsS0FBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSSxDQUFDLENBQUMsQ0FBQztvQkFDckYsS0FBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsS0FBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSSxDQUFDLENBQUMsQ0FBQztvQkFDL0UsS0FBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsS0FBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSSxDQUFDLENBQUMsQ0FBQztvQkFFOUUsS0FBSSxDQUFDLGVBQWUsRUFBRSxDQUFDOztnQkFFekIsQ0FBQztnQkFFTyx5Q0FBZSxHQUF2QjtvQkFFRSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBRTdDLENBQUM7Z0JBRU8sd0NBQWMsR0FBdEI7b0JBQUEsaUJBTUM7b0JBSkMsZ0JBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxVQUFBLFNBQVM7d0JBQ2pDLEtBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDakYsQ0FBQyxDQUFDLENBQUM7Z0JBRUwsQ0FBQztnQkFFTSxvQ0FBVSxHQUFqQjtvQkFBQSxpQkF1Q0M7b0JBckNDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEtBQUssRUFBRSxFQUFFO3dCQUUzRCxJQUFJLGdCQUFjLEdBQUc7NEJBQ25CLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQzs0QkFDckMsTUFBTSxFQUFFLEtBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFjO3lCQUNwQyxDQUFDO3dCQUVGLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEtBQUssRUFBRSxFQUFFOzRCQUMzRCxnQkFBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFSLENBQVEsQ0FBQyxFQUFFLFVBQUEsR0FBRztnQ0FDOUQsZ0JBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzRCQUNoQyxDQUFDLENBQUMsQ0FBQzt5QkFDSjt3QkFFRCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxLQUFLLEVBQUUsRUFBRTs0QkFDakUsZ0JBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFnQixJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWlCLENBQUMsQ0FBQzt5QkFDdkU7d0JBRUQsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEtBQUssRUFBRSxFQUFFOzRCQUNyRSxnQkFBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBbUIsQ0FBQyxDQUFDO3lCQUN2RTt3QkFFRCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsS0FBSyxFQUFFLEVBQUU7NEJBQ25FLGdCQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBaUIsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxLQUFLLENBQUUsQ0FBQyxDQUFDO3lCQUNsRjt3QkFFRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxnQkFBYyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsUUFBUTs0QkFDcEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLENBQUM7NEJBQ3ZDLEtBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQzs0QkFDNUIsS0FBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDOzRCQUM1QixLQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7NEJBQy9CLEtBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsRUFBRSxDQUFDOzRCQUNqQyxLQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQzs0QkFDaEMsS0FBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO3dCQUN6QixDQUFDLENBQUMsQ0FBQztxQkFFSjtnQkFFSCxDQUFDO2dCQUVNLHlDQUFlLEdBQXRCO29CQUFBLGlCQVVDO29CQVJDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFFM0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsK0NBQTRDLElBQUksQ0FBQyxLQUFLLENBQUMsMEJBQTBCLElBQUksRUFBRSxDQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxXQUFXO3dCQUM3SCxLQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQzt3QkFDaEMsS0FBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNoQixDQUFDLENBQUMsQ0FBQztvQkFFSCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDN0csQ0FBQztnQkFFTSw4QkFBSSxHQUFYLFVBQVksS0FBVSxFQUFFLElBQVMsRUFBRSxLQUFVLEVBQUUsSUFBUztvQkFFdEQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7b0JBQ25CLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO29CQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztvQkFFbkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7Z0JBQ25CLENBQUM7Z0JBdkhhLDJCQUFXLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDO2dCQXlIekQsc0JBQUM7YUFBQSxBQTNIRCxDQUE4QixlQUFTOztZQTZIbkMsaUJBQWlCLEdBQUcsVUFBVSxVQUFlO2dCQUUvQyxPQUFPLE9BQ1AsVUFBVSxDQUFDLElBQUkseUJBRUYsVUFBVSxDQUFDLEtBQUssVUFBSyxVQUFVLENBQUMsS0FBSyx3QkFDcEMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyx1QkFDNUIsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxpQkFDbEMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQ2pDLENBQUM7WUFFSixDQUFDLENBQUM7WUFFRSxvQkFBb0IsR0FBRyxVQUFVLFlBQW1CLEVBQUUsVUFBa0IsRUFBRSxnQkFBd0I7Z0JBRXBHLElBQUksZUFBZSxHQUFHLGdCQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRWhGLElBQUksVUFBVSxLQUFLLHFCQUFxQixFQUFFO29CQUN4QyxlQUFlLEdBQUcsZ0JBQUMsQ0FBQyxNQUFNLENBQUMsZUFBZSxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDckY7cUJBQU0sSUFBSSxVQUFVLEtBQUssd0JBQXdCLEVBQUU7b0JBQ2xELGVBQWUsR0FBRyxnQkFBQyxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNoRjtnQkFFRCxPQUFPLGdCQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBRW5ELENBQUMsQ0FBQztZQUVFLGFBQWEsR0FBRyxVQUFVLDJCQUEyQjtnQkFFdkQsT0FBTywrRUFHdUIsMkJBQTJCLElBQUksT0FBTyx3REFJbkUsQ0FBQztZQUVKLENBQUMsQ0FBQztZQUVGLGVBQWUsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHO2dCQUFBLGlCQXlDbEM7Z0JBdENDLElBQUksVUFBVSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO2dCQUM1RSxJQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM5QyxLQUFLLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQztnQkFDeEIsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFFckQsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxZQUFZLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDO2dCQUV0SSxnQkFBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLFVBQUMsVUFBVTtvQkFFbkMsSUFBSSxPQUFPLEdBQUcsVUFBVSxDQUFDO29CQUN6QixPQUFPLENBQUMsV0FBVyxHQUFHLEtBQUcsVUFBVSxDQUFDLElBQU0sQ0FBQztvQkFDM0MsT0FBTyxDQUFDLFlBQVksR0FBRyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFFckQsT0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBRTVDLElBQUksdUJBQXVCLEdBQVUsRUFBRSxDQUFDO29CQUN4QyxJQUFJLEtBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLHFCQUFxQixLQUFLLElBQUksSUFBSSxPQUFPLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxLQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRTt3QkFDOUosdUJBQXVCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO3FCQUMvQztvQkFDRCxPQUFPLENBQUMsWUFBWSxHQUFHLHVCQUF1QixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFFekQsT0FBTyxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7b0JBQ3pCLGdCQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsVUFBQSxHQUFHO3dCQUN0QixJQUFJLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEtBQUssSUFBSSxFQUFFOzRCQUNqRSxPQUFPLENBQUMsV0FBVyxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUMsQ0FBQzt5QkFDeEY7NkJBQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxLQUFLLElBQUksRUFBRTs0QkFDdEUsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7eUJBQ2pGOzZCQUFNLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLElBQUksRUFBRTs0QkFDekUsT0FBTyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQzt5QkFDakc7b0JBQ0gsQ0FBQyxDQUFDLENBQUM7b0JBRUgsS0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzlCLENBQUMsQ0FBQyxDQUFDO1lBRUwsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vPHJlZmVyZW5jZSBwYXRoPVwiLi4vbm9kZV9tb2R1bGVzL2dyYWZhbmEtc2RrLW1vY2tzL2FwcC9oZWFkZXJzL2NvbW1vbi5kLnRzXCIgLz5cclxuXHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHsgUGFuZWxDdHJsLCBsb2FkUGx1Z2luQ3NzIH0gZnJvbSBcImFwcC9wbHVnaW5zL3Nka1wiO1xyXG5cclxubGV0IFBMVUdJTl9JRCA9IFwieWVzb3JleWVyYW0tYm9vbWNvbW1lbnRzLXBhbmVsXCI7XHJcblxyXG5jb25zdCBDT05GSUcgPSB7XHJcbiAgY29tbWVudF9wb3N0Ym94X3Bvc2l0aW9uczogW1xyXG4gICAgeyB0ZXh0OiBcIlRvcFwiLCB2YWx1ZTogXCJ0b3BcIiB9LFxyXG4gICAgeyB0ZXh0OiBcIkJvdHRvbVwiLCB2YWx1ZTogXCJib3R0b21cIiB9LFxyXG4gIF0sXHJcbiAgY29tbWVudF90YWc6IFwiYm9vbS1jb21tZW50XCIsXHJcbiAgY29tbWVudHNfb3JkZXI6IFtcclxuICAgIHsgdGV4dDogXCJOZXcgQ29tbWVudHMgYXQgVG9wXCIsIHZhbHVlOiBcIm5ld19jb21tZW50c19hdF90b3BcIiB9LFxyXG4gICAgeyB0ZXh0OiBcIk5ldyBDb21tZW50cyBhdCBCb3R0b21cIiwgdmFsdWU6IFwibmV3X2NvbW1lbnRzX2F0X2JvdHRvbVwiIH0sXHJcbiAgXSxcclxuICBjc3NUaGVtZXM6IHtcclxuICAgIGRhcms6IGBwbHVnaW5zLyR7UExVR0lOX0lEfS9jc3MvZGVmYXVsdC5kYXJrLmNzc2AsXHJcbiAgICBsaWdodDogYHBsdWdpbnMvJHtQTFVHSU5fSUR9L2Nzcy9kZWZhdWx0LmxpZ2h0LmNzc2BcclxuICB9LFxyXG4gIGRlZmF1bHRfdGVtcGxhdGVVUkw6IFwicGFydGlhbHMvbW9kdWxlLmh0bWxcIixcclxuICBlZGl0b3JUYWJzOiBbXHJcbiAgICB7XHJcbiAgICAgIHBvc2l0aW9uOiAyLFxyXG4gICAgICB0ZW1wbGF0ZVBhdGg6IGBwdWJsaWMvcGx1Z2lucy8ke1BMVUdJTl9JRH0vcGFydGlhbHMvb3B0aW9ucy5odG1sYCxcclxuICAgICAgdGl0bGU6IFwiUGFuZWwgT3B0aW9uc1wiXHJcbiAgICB9XHJcbiAgXSxcclxuICBncmFmYW5hX2V2ZW50czoge1xyXG4gICAgZGF0YVJlY2VpdmVkOiBcImRhdGEtcmVjZWl2ZWRcIixcclxuICAgIGluaXRFZGl0TW9kZTogXCJpbml0LWVkaXQtbW9kZVwiLFxyXG4gICAgcGFuZWxUZWFyZG93bjogXCJwYW5lbC10ZWFyZG93blwiLFxyXG4gICAgcmVmcmVzaDogXCJyZWZyZXNoXCIsXHJcbiAgICByZW5kZXI6IFwicmVuZGVyXCJcclxuICB9XHJcbn07XHJcblxyXG5cclxubG9hZFBsdWdpbkNzcyhDT05GSUcuY3NzVGhlbWVzKTtcclxuXHJcbmNsYXNzIEJvb21Db21tZW50c0N0bCBleHRlbmRzIFBhbmVsQ3RybCB7XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgdGVtcGxhdGVVcmwgPSBDT05GSUcuZGVmYXVsdF90ZW1wbGF0ZVVSTDtcclxuICBwdWJsaWMgc2NvcGU6IGFueTtcclxuICBwdWJsaWMgY3RybDogYW55O1xyXG4gIHB1YmxpYyBlbGVtOiBhbnk7XHJcbiAgcHVibGljIGF0dHJzOiBhbnk7XHJcbiAgcHVibGljICRodHRwOiBhbnk7XHJcbiAgcHVibGljIGJhY2tlbmRTcnY6IGFueTtcclxuICBwdWJsaWMgbmV4dFRpY2tQcm9taXNlOiBhbnk7XHJcbiAgcHVibGljIHJhd19jb21tZW50czogYW55W10gPSBbXTtcclxuICBwdWJsaWMgY29tbWVudHM6IGFueVtdID0gW107XHJcbiAgcHVibGljIGFjdGl2ZUVkaXRvclRhYkluZGV4ID0gLTI7XHJcbiAgcHVibGljIGNvbW1lbnRfcG9zdGJveF9wb3NpdGlvbnMgPSBDT05GSUcuY29tbWVudF9wb3N0Ym94X3Bvc2l0aW9ucztcclxuICBwdWJsaWMgY29tbWVudHNfb3JkZXIgPSBDT05GSUcuY29tbWVudHNfb3JkZXI7XHJcblxyXG4gIHB1YmxpYyBwYW5lbERlZmF1bHRzID0ge1xyXG5cclxuICAgIGNvbW1lbnRfcG9zdGJveF9wb3NpdGlvbjogXCJib3R0b21cIixcclxuICAgIGNvbW1lbnRfdGFnOiBDT05GSUcuY29tbWVudF90YWcsXHJcbiAgICBjb21tZW50c19vcmRlcjogXCJuZXdfY29tbWVudHNfYXRfdG9wXCIsXHJcbiAgICBlbmFibGVfaW5saW5lX2NvbW1lbnRib3g6IGZhbHNlLFxyXG4gICAgaGlnaGxpZ2h0X25ld0NvbW1lbnRzOiB0cnVlLFxyXG4gICAgaGlnaGxpZ2h0X25ld0NvbW1lbnRzX2NvbG9yOiBcInllbGxvd1wiLFxyXG4gICAgaGlnaGxpZ2h0X25ld0NvbW1lbnRzX21pbnV0ZXM6IDMsXHJcbiAgICBudW1iZXJfb2ZfY29tbWVudHNfdG9fc2hvdzogNSxcclxuICAgIHJlZnJlc2hfZnJlcXVlbmN5OiAxMFxyXG5cclxuICB9O1xyXG5cclxuICBjb25zdHJ1Y3Rvcigkc2NvcGUsICRpbmplY3RvciwgJGh0dHAsIGJhY2tlbmRTcnYpIHtcclxuXHJcbiAgICBzdXBlcigkc2NvcGUsICRpbmplY3Rvcik7XHJcbiAgICBfLmRlZmF1bHRzRGVlcCh0aGlzLnBhbmVsLCB0aGlzLnBhbmVsRGVmYXVsdHMpO1xyXG5cclxuICAgIHRoaXMuJGh0dHAgPSAkaHR0cDtcclxuICAgIHRoaXMuYmFja2VuZFNydiA9IGJhY2tlbmRTcnY7XHJcblxyXG4gICAgdGhpcy5ldmVudHMub24oQ09ORklHLmdyYWZhbmFfZXZlbnRzLmluaXRFZGl0TW9kZSwgdGhpcy5vbkluaXRFZGl0TW9kZS5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuZXZlbnRzLm9uKENPTkZJRy5ncmFmYW5hX2V2ZW50cy5wYW5lbFRlYXJkb3duLCB0aGlzLm9uUGFuZWxUZWFyZG93bi5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuZXZlbnRzLm9uKENPTkZJRy5ncmFmYW5hX2V2ZW50cy5yZWZyZXNoLCB0aGlzLnJlZnJlc2hDb21tZW50cy5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuZXZlbnRzLm9uKENPTkZJRy5ncmFmYW5hX2V2ZW50cy5yZW5kZXIsIHRoaXMucmVmcmVzaENvbW1lbnRzLmJpbmQodGhpcykpO1xyXG5cclxuICAgIHRoaXMucmVmcmVzaENvbW1lbnRzKCk7XHJcblxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBvblBhbmVsVGVhcmRvd24oKSB7XHJcblxyXG4gICAgdGhpcy4kdGltZW91dC5jYW5jZWwodGhpcy5uZXh0VGlja1Byb21pc2UpO1xyXG5cclxuICB9XHJcblxyXG4gIHByaXZhdGUgb25Jbml0RWRpdE1vZGUoKTogdm9pZCB7XHJcblxyXG4gICAgXy5lYWNoKENPTkZJRy5lZGl0b3JUYWJzLCBlZGl0b3JUYWIgPT4ge1xyXG4gICAgICB0aGlzLmFkZEVkaXRvclRhYihlZGl0b3JUYWIudGl0bGUsIGVkaXRvclRhYi50ZW1wbGF0ZVBhdGgsIGVkaXRvclRhYi5wb3NpdGlvbik7XHJcbiAgICB9KTtcclxuXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYWRkQ29tbWVudCgpOiB2b2lkIHtcclxuXHJcbiAgICBpZiAodGhpcy5jdHJsLmNvbW1lbnRfdGV4dCAmJiB0aGlzLmN0cmwuY29tbWVudF90ZXh0ICE9PSBcIlwiKSB7XHJcblxyXG4gICAgICBsZXQgY29tbWVudE9wdGlvbnMgPSB7XHJcbiAgICAgICAgXCJ0YWdzXCI6IFt0aGlzLmN0cmwucGFuZWwuY29tbWVudF90YWddLFxyXG4gICAgICAgIFwidGV4dFwiOiBgJHt0aGlzLmN0cmwuY29tbWVudF90ZXh0fWBcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmICh0aGlzLmN0cmwuY29tbWVudF90YWdzICYmIHRoaXMuY3RybC5jb21tZW50X3RhZ3MgIT09IFwiXCIpIHtcclxuICAgICAgICBfLmVhY2godGhpcy5jdHJsLmNvbW1lbnRfdGFncy5zcGxpdChcIjtcIikubWFwKHQgPT4gdC50cmltKCkpLCB0YWcgPT4ge1xyXG4gICAgICAgICAgY29tbWVudE9wdGlvbnMudGFncy5wdXNoKHRhZyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLmN0cmwuY29tbWVudF9iZ0NvbG9yICYmIHRoaXMuY3RybC5jb21tZW50X2JnQ29sb3IgIT09IFwiXCIpIHtcclxuICAgICAgICBjb21tZW50T3B0aW9ucy50YWdzLnB1c2goYGJvb20tYmdjb2xvcj0ke3RoaXMuY3RybC5jb21tZW50X2JnQ29sb3J9YCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLmN0cmwuY29tbWVudF90ZXh0Q29sb3IgJiYgdGhpcy5jdHJsLmNvbW1lbnRfdGV4dENvbG9yICE9PSBcIlwiKSB7XHJcbiAgICAgICAgY29tbWVudE9wdGlvbnMudGFncy5wdXNoKGBib29tLWNvbG9yPSR7dGhpcy5jdHJsLmNvbW1lbnRfdGV4dENvbG9yfWApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGhpcy5jdHJsLmNvbW1lbnRfZm9udFNpemUgJiYgdGhpcy5jdHJsLmNvbW1lbnRfZm9udFNpemUgIT09IFwiXCIpIHtcclxuICAgICAgICBjb21tZW50T3B0aW9ucy50YWdzLnB1c2goYGJvb20tZm9udHNpemU9JHt0aGlzLmN0cmwuY29tbWVudF9mb250U2l6ZSB8fCBcIjEwMFwifWApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmJhY2tlbmRTcnYucG9zdCgnL2FwaS9hbm5vdGF0aW9ucycsIGNvbW1lbnRPcHRpb25zKS50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkNvbW1lbnQgYWRkZWRcIiwgcmVzcG9uc2UpO1xyXG4gICAgICAgIHRoaXMuY3RybC5jb21tZW50X3RleHQgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMuY3RybC5jb21tZW50X3RhZ3MgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMuY3RybC5jb21tZW50X2JnQ29sb3IgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMuY3RybC5jb21tZW50X3RleHRDb2xvciA9IFwiXCI7XHJcbiAgICAgICAgdGhpcy5jdHJsLmNvbW1lbnRfZm9udFNpemUgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMucmVmcmVzaENvbW1lbnRzKCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVmcmVzaENvbW1lbnRzKCk6IHZvaWQge1xyXG5cclxuICAgIHRoaXMuJHRpbWVvdXQuY2FuY2VsKHRoaXMubmV4dFRpY2tQcm9taXNlKTtcclxuXHJcbiAgICB0aGlzLmJhY2tlbmRTcnYuZ2V0KGAvYXBpL2Fubm90YXRpb25zP3RhZ3M9Ym9vbS1jb21tZW50JmxpbWl0PSR7dGhpcy5wYW5lbC5udW1iZXJfb2ZfY29tbWVudHNfdG9fc2hvdyB8fCAxMH1gKS50aGVuKGFubm90YXRpb25zID0+IHtcclxuICAgICAgdGhpcy5yYXdfY29tbWVudHMgPSBhbm5vdGF0aW9ucztcclxuICAgICAgdGhpcy5yZW5kZXIoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMubmV4dFRpY2tQcm9taXNlID0gdGhpcy4kdGltZW91dCh0aGlzLnJlZnJlc2hDb21tZW50cy5iaW5kKHRoaXMpLCB0aGlzLnBhbmVsLnJlZnJlc2hfZnJlcXVlbmN5ICogMTAwMCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgbGluayhzY29wZTogYW55LCBlbGVtOiBhbnksIGF0dHJzOiBhbnksIGN0cmw6IGFueSk6IHZvaWQge1xyXG5cclxuICAgIHRoaXMuc2NvcGUgPSBzY29wZTtcclxuICAgIHRoaXMuZWxlbSA9IGVsZW07XHJcbiAgICB0aGlzLmF0dHJzID0gYXR0cnM7XHJcblxyXG4gICAgdGhpcy5jdHJsID0gY3RybDtcclxuICB9XHJcblxyXG59XHJcblxyXG5sZXQgZ2V0VG9vbHRpcE1lc3NhZ2UgPSBmdW5jdGlvbiAoYW5ub3RhdGlvbjogYW55KTogc3RyaW5nIHtcclxuXHJcbiAgcmV0dXJuIGBcclxuJHthbm5vdGF0aW9uLnRleHR9XHJcblxyXG5NZXNzYWdlIGJ5IDogJHthbm5vdGF0aW9uLmxvZ2lufSAoJHthbm5vdGF0aW9uLmVtYWlsfSlcclxuQ3JlYXRlZCBhdCA6ICR7IG5ldyBEYXRlKGFubm90YXRpb24uY3JlYXRlZCl9XHJcblVwZGF0ZWQgYXQgOiAkeyBuZXcgRGF0ZShhbm5vdGF0aW9uLnVwZGF0ZWQpfVxyXG5UYWdzIDogJHsgYW5ub3RhdGlvbi50YWdzLmpvaW4oXCIsIFwiKX1cclxuICBgO1xyXG5cclxufTtcclxuXHJcbmxldCBzb3J0QW5kU2xpY2VDb21tZW50cyA9IGZ1bmN0aW9uIChyYXdfY29tbWVudHM6IGFueVtdLCBzb3J0X29yZGVyOiBzdHJpbmcsIGVsZW1lbnRzVG9SZXR1cm46IG51bWJlcik6IGFueVtdIHtcclxuXHJcbiAgbGV0IHNvcnRlZF9jb21tZW50cyA9IF8uc29ydEJ5KHJhd19jb21tZW50cywgW2Z1bmN0aW9uIChvKSB7IHJldHVybiBvLnRpbWU7IH1dKTtcclxuXHJcbiAgaWYgKHNvcnRfb3JkZXIgPT09IFwibmV3X2NvbW1lbnRzX2F0X3RvcFwiKSB7XHJcbiAgICBzb3J0ZWRfY29tbWVudHMgPSBfLnNvcnRCeShzb3J0ZWRfY29tbWVudHMsIFtmdW5jdGlvbiAobykgeyByZXR1cm4gLTEgKiBvLnRpbWU7IH1dKTtcclxuICB9IGVsc2UgaWYgKHNvcnRfb3JkZXIgPT09IFwibmV3X2NvbW1lbnRzX2F0X2JvdHRvbVwiKSB7XHJcbiAgICBzb3J0ZWRfY29tbWVudHMgPSBfLnNvcnRCeShzb3J0ZWRfY29tbWVudHMsIFtmdW5jdGlvbiAobykgeyByZXR1cm4gby50aW1lOyB9XSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gXy50YWtlKHNvcnRlZF9jb21tZW50cywgZWxlbWVudHNUb1JldHVybik7XHJcblxyXG59O1xyXG5cclxubGV0IGdldFBhbmVsU3R5bGUgPSBmdW5jdGlvbiAoaGlnaGxpZ2h0X25ld0NvbW1lbnRzX2NvbG9yKTogc3RyaW5nIHtcclxuXHJcbiAgcmV0dXJuIGBcclxuICAgIEBrZXlmcmFtZXMgYmxpbmtiZyB7XHJcbiAgICAgICAgNTAlIHtcclxuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogJHtoaWdobGlnaHRfbmV3Q29tbWVudHNfY29sb3IgfHwgXCJ3aGl0ZVwifTtcclxuICAgICAgICAgICAgY29sb3I6IGJsYWNrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICBgO1xyXG5cclxufTtcclxuXHJcbkJvb21Db21tZW50c0N0bC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHJcbiAgbGV0IHBhbmVsU3R5bGUgPSBnZXRQYW5lbFN0eWxlKHRoaXMuY3RybC5wYW5lbC5oaWdobGlnaHRfbmV3Q29tbWVudHNfY29sb3IpO1xyXG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuICBzdHlsZS50eXBlID0gJ3RleHQvY3NzJztcclxuICBzdHlsZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShwYW5lbFN0eWxlKSk7XHJcbiAgdGhpcy5lbGVtLmZpbmQoXCIjYm9vbS1jb21tZW50cy1zdHlsZVwiKS5odG1sKFwiXCIpO1xyXG4gIHRoaXMuZWxlbS5maW5kKFwiI2Jvb20tY29tbWVudHMtc3R5bGVcIikuYXBwZW5kKHN0eWxlKTtcclxuXHJcbiAgdGhpcy5jb21tZW50cyA9IFtdO1xyXG4gIHRoaXMucmF3X2NvbW1lbnRzID0gc29ydEFuZFNsaWNlQ29tbWVudHModGhpcy5yYXdfY29tbWVudHMsIHRoaXMucGFuZWwuY29tbWVudHNfb3JkZXIsICsodGhpcy5jdHJsLnBhbmVsLm51bWJlcl9vZl9jb21tZW50c190b19zaG93KSk7XHJcblxyXG4gIF8uZWFjaCh0aGlzLnJhd19jb21tZW50cywgKGFubm90YXRpb24pID0+IHtcclxuXHJcbiAgICBsZXQgY29tbWVudCA9IGFubm90YXRpb247XHJcbiAgICBjb21tZW50LmRpc3BsYXlUZXh0ID0gYCR7YW5ub3RhdGlvbi50ZXh0fWA7XHJcbiAgICBjb21tZW50LmRpc3BsYXlUaXRsZSA9IGdldFRvb2x0aXBNZXNzYWdlKGFubm90YXRpb24pO1xyXG5cclxuICAgIGNvbW1lbnQuZGF0ZSA9IG5ldyBEYXRlKGFubm90YXRpb24uY3JlYXRlZCk7XHJcblxyXG4gICAgbGV0IGRpc3BsYXlfY29tbWVudF9jbGFzc2VzOiBhbnlbXSA9IFtdO1xyXG4gICAgaWYgKHRoaXMuY3RybC5wYW5lbC5oaWdobGlnaHRfbmV3Q29tbWVudHMgPT09IHRydWUgJiYgY29tbWVudC5jcmVhdGVkID4gKChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgLSAodGhpcy5jdHJsLnBhbmVsLmhpZ2hsaWdodF9uZXdDb21tZW50c19taW51dGVzICogNjAgKiAxMDAwKSkpIHtcclxuICAgICAgZGlzcGxheV9jb21tZW50X2NsYXNzZXMucHVzaChcImJsaW5rLWNvbW1lbnRcIik7XHJcbiAgICB9XHJcbiAgICBjb21tZW50LmRpc3BsYXlDbGFzcyA9IGRpc3BsYXlfY29tbWVudF9jbGFzc2VzLmpvaW4oXCIgXCIpO1xyXG5cclxuICAgIGNvbW1lbnQuaW5saW5lc3R5bGUgPSB7fTtcclxuICAgIF8uZWFjaChjb21tZW50LnRhZ3MsIHRhZyA9PiB7XHJcbiAgICAgIGlmICh0YWcudHJpbSgpLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChcImJvb20tYmdjb2xvcj1cIikgPT09IHRydWUpIHtcclxuICAgICAgICBjb21tZW50LmlubGluZXN0eWxlLmJhY2tncm91bmQgPSB0YWcudHJpbSgpLnRvTG93ZXJDYXNlKCkucmVwbGFjZShcImJvb20tYmdjb2xvcj1cIiwgXCJcIik7XHJcbiAgICAgIH0gZWxzZSBpZiAodGFnLnRyaW0oKS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoXCJib29tLWNvbG9yPVwiKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGNvbW1lbnQuaW5saW5lc3R5bGUuY29sb3IgPSB0YWcudHJpbSgpLnRvTG93ZXJDYXNlKCkucmVwbGFjZShcImJvb20tY29sb3I9XCIsIFwiXCIpO1xyXG4gICAgICB9IGVsc2UgaWYgKHRhZy50cmltKCkudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKFwiYm9vbS1mb250c2l6ZT1cIikgPT09IHRydWUpIHtcclxuICAgICAgICBjb21tZW50LmlubGluZXN0eWxlW1wiZm9udC1zaXplXCJdID0gdGFnLnRyaW0oKS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoXCJib29tLWZvbnRzaXplPVwiLCBcIlwiKSArIFwiJVwiO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmNvbW1lbnRzLnB1c2goY29tbWVudCk7XHJcbiAgfSk7XHJcblxyXG59O1xyXG5cclxuZXhwb3J0IHsgQm9vbUNvbW1lbnRzQ3RsIGFzIFBhbmVsQ3RybCB9O1xyXG4iXX0=