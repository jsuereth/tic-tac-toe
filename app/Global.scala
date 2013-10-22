import play.api._
import play.api.libs.concurrent.Akka

object Global extends GlobalSettings {
  
  override def onStart(app: Application): Unit = {
    val system = Akka.system(app)
    // TODO - Create game actors...
    system.actorOf(server.GameRoom.props, "gameroom")
    println("Created game room!")
  }
}