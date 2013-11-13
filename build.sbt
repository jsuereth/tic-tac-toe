name := """tic-tac-toe"""

version := "1.0-SNAPSHOT"

libraryDependencies ++= Seq(
  javaCore,  // The core Java API

  // WebJars pull in client-side web libraries
  "org.webjars" %% "webjars-play" % "2.2.0",
  "org.webjars" % "jquery" % "1.9.3",
  "org.webjars" % "knockout" % "2.3.0"
)

play.Project.playScalaSettings

closureCompilerOptions := Seq("rjs")
