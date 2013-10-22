package controllers

import play.api.mvc._

object MainController extends Controller {
  def debug() = Action {
    Ok(views.html.debug.render())
  }
}
