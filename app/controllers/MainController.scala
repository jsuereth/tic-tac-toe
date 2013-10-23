package controllers

import play.api.mvc._

object MainController extends Controller {

  def index() = Action {
    Ok(views.html.index())
  }

  def debug() = Action {
    Ok(views.html.debug.render())
  }

}
