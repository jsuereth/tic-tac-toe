package controllers

import play.api.mvc._

object MainController extends Controller {
  def index() = Action {
    Ok(views.html.index.render("Hello"))
  }
}
