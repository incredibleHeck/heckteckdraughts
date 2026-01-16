/*
 * Copyright 1996 by Michel D. Grimminck
 *
 * All Rights Reserved
 *
 * Permission to use, copy, modify, and distribute this software and its
 * documentation for any purpose and without fee is hereby granted,
 * provided that the above copyright notice appear in all copies and that
 * both that copyright notice and this permission notice appear in
 * supporting documentation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

#include <stdio.h>
#include "functions.h"
#include <string.h>
#include <time.h>
#include <math.h>
#include "var.h"
#include <signal.h>

extern int abc_1,abc_2;
int timeControlMode=TCM_TIME_PER_MOVE;
float timeControlTimePerMove=4.0F;
int timeControlMaxPly=5;

#ifdef RIP
#define N 10316
int brother[N],child[N];
unsigned char move[N][2];
int path[100];

void rip(int q,int l)
{
    int i,b;
    if (move[q][0]==0 || q==1) {
        for(i=0;i<l;i++) {
            if (i%8==0) dprint("\n");
            if (i%2==0) dprint("%i. ",i/2+1);
            dprint("%i-%i ",move[path[i]][0],move[path[i]][1]);

        }
        dprint("* \n");
        return;
    }
    /* for me and all my brothers: rip */
    b=q;
    do {
        path[l]=b;
        rip(child[b]+1,l+1);
        b=brother[b]+1;
    } while(b!=1);
    return;
}

void rip_opening(void)
{
    int i,j;
    FILE *in;
    in=fopen("/dos/games/dammen/dam.opn","r");

    for(i=0;i<6*N;i+=6) {
        int x[6],j,n1,n2;
        for(j=0;j<6;j++) x[j]=fgetc(in);
        /*dprint("%i   ",i/6);*/
        n1=x[0]+256*x[1]; n2=x[2]+256*x[3];
        /*dprint("%6i(%i) %6i(%i) %3i %3i",n1/3,n1%3,n2/3,n2%3,x[5],x[4]);*/
        brother[i/6]=n1/3; child[i/6]=n2/3;
        /*dprint("%i %i\n",i/6,brother[i/6]);*/
        move[i/6][0]=x[5]; move[i/6][1]=x[4];
        /*dprint("\n");*/
    }
    fclose(in);
    rip(2,0);
}
#endif

#ifdef WIEGER
void read_wieger(void)
{
    FILE *in,*out;
    char buffer[500][3][200],filename[200];
    int i,j;

    in=fopen("test/wieger","r");
    if (in==NULL) {
        dprint("wieger error\n");
        return;
    }
    init_board();
    for(i=0;i<490;i++) {
        fgets(buffer[i][0],200,in);
        fgets(buffer[i][1],200,in);
        fgets(buffer[i][2],200,in);
        for(j=0;j<50;j++) {
            if (buffer[i][0][j]=='.') board[map[j]]=empty;
            if (buffer[i][0][j]=='w') board[map[j]]=white|man;
            if (buffer[i][0][j]=='z') board[map[j]]=black|man;
            if (buffer[i][0][j]=='W') board[map[j]]=white|crown;
            if (buffer[i][0][j]=='Z') board[map[j]]=black|crown;
        }
        dprint("%i\n",i);
        display_board();
        dprint("%s\n%s\n",buffer[i][1],buffer[i][2]);
        sprintf(filename,"wieger/%.3i",i);
        save_board(2,filename);
        out=fopen(filename,"a");
    if (out==NULL) {dprint("append error %i\n",i); continue;}
        fprintf(out,"%s\n%s\n",buffer[i][1],buffer[i][2]);
        fclose(out);
    }
    fclose(in);
}
#endif

void stopprogram(int sig)
{
    char a[10];
    
    if (windows==true) {
        winprint("\n");
        winprint("BYE\n");
        exit(0);
    }
    dprint("\nReally quit? "); fflush(stdout);
    dscanf("%s",a);
    if (a[0]=='y' || a[0]=='Y') exit(0);
}

void setHash(int n)
{
    printf("h:%i %i\n",sizeof(tpTranspos),transpos);
    
    if (transpos!=NULL) {
        free(transpos);
    }
    transpos=(tpTranspos*) calloc(sizeof(tpTranspos),n);
    if (transpos!=NULL) {
        tablesize=n;
    } else {
        transpos=(tpTranspos*) calloc(sizeof(tpTranspos),5001);
        n=5001;
    }
    init_hash();
    winprint("\n");
    winprint("HASHSIZE %i\n",tablesize);
}

void d_init(void)
{
    int i,dbssize=0;
    extern DBINDEX bytesize[4096];
    extern int npattree,npat;

    dprint("%s\n",VERSION);
    init_var();
    init_databases();
    mem64_init(true);
    init_patterns();
    init_board();
    set_position(parameters[13],parameters[14]);
    init_tstats();
    init_tables();
    //init_tpat();
    init_takeback();
    initDetectPatterns();
    loadBreakThrough();
    setHash(NHASH);
    #ifdef MAPPEDMEMORY
    /* XXX*/
    #else
        for(i=0;i<4096;i++) if (database[i]!=NULL) dbssize+=bytesize[i];
    #endif
    dprint("hashtables:%.1f Mb\n",(float) tablesize*sizeof(transpos[0])/1024/1024);
    dprint("evaltables:%.1f Mb\n",(float) MAXEVAL*sizeof(evalcache[0])/1024/1024);
    dprint("patterns:%.1f Mb\n",(float) (npattree*28+npat*sizeof(tpat[0]))/1024/1024);
    dprint("databases:%.1f Mb\n",(float) dbssize/1024/1024);
    for(i=1;i<16;i++) dprint("%i ",param_a[i]); dprint("\n");
    for(i=1;i<16;i++) dprint("%i ",param_b[i]); dprint("\n");
    for(i=1;i<16;i++) dprint("%i ",param_c[i]); dprint("\n");
}

#ifdef MAKEDLL
__attribute__((stdcall)) int helloWorld(int test)
{   
    return test+game_color;
}
#endif

#ifndef QT
int main(int argc,char* argv[])
{
    int i;
    int in1,in2;
    char input[1024],buffer[100];
    int alfa=-INF,beta=INF,fitdepth=-999;
    int asa=false;
    FILE *in;
    int my_color=white;
    char args[40000];
    
    //db33=malloc(205001002);
    //for (i=0;i<205001002;i++) db33[i]=0;
    
    /*read_wingame();*/
    /*dfscanf(in,"%s",input);*/
    strcpy(pagefile,"tmp/mem64-%i-%i.page");
    dprint ("-->%s",input);
    allowTwoPlyIncrements=false;

    
    d_init();
#ifdef RIP
    rip_opening();
#endif
#ifdef WIEGER
    read_wieger();
#endif
/*
    for(i=0;i<93;i++) {
        if (board[i]==invalid) {
            printf("out[%i]=invalid;\n",i);
        }
        else {
            printf("if (in[%i]!=0) {out[%i]=in[%i]\^1;} else {out[%i]=0;}\n",map[49-invmap[i]],i,map[49-invmap[i]],i);
        }
    }
*/
    
    i=1;
    while(i<argc) {
        if (strcmp(argv[i],"-in")==0) {
            load_board(argv[++i]);
            init_tstats();
        }
        if (strcmp(argv[i],"-ref")==0) {
            int score;
            sscanf(argv[++i],"%s",pdnfile);
            parameters[0]=-2;
            search_min=0;
            search_max=40;
            perc=1;
            score=check_database(pdnfile,search_min,search_max);
            dprint("score:%i\n",score);
        }
        if (strcmp(argv[i],"-cbook")==0) {
            int sizes[NTABLE],j;
            sscanf(argv[++i],"%s",pdnfile);
            for(j=0;j<NTABLE;j++) sscanf(argv[++i],"%i",sizes[i]);
            parameters[0]=-3;
            search_min=0;
            search_max=40;
            perc=1;
        }
        if (strcmp(argv[i],"-pdncommand")==0) {
            sscanf(argv[++i],"%s",pdnfile);
            sscanf(argv[++i],"%i",&fitdepth);
            sscanf(argv[++i],"%i",&search_min);
            sscanf(argv[++i],"%i",&search_max);
            sscanf(argv[++i],"%f",&perc);
            parameters[0]=fitdepth;
            if (asa==false) {
                int score;
                score=check_database(pdnfile,search_min,search_max);
                dprint("score:%i\n",score);
            }
            if (asa==true) {
                parameters[0]=fitdepth;
                /*asa_main();*/
            }
        }
        if (strcmp(argv[i],"-pdn")==0) {
            sscanf(argv[++i],"%s",pdnfile);
            search_min=0;
            search_max=40;
            perc=1.0;
            parameters[0]=-4;
            check_database(pdnfile,search_min,search_max);
        }
        if  (strcmp(argv[i],"-asa")==0) {
            asa=true;
        }
        if  (strcmp(argv[i],"-asa")==0) {
            char name[256];
            sscanf(argv[++i],"%i",name);
            save_board(white,name);
        }
        if  (strcmp(argv[i],"-x")==0) {
            /*Xboard(1,argv)*/;
        }
        if  (strcmp(argv[i],"-v")==0) {
            dprint("%s\n",VERSION);
            exit(0);
        }
        if  (strcmp(argv[i],"-dir")==0) {
            sscanf(argv[++i],"%i",workdir);
        }
        if  (strcmp(argv[i],"-nocolor")==0) {
            usecol=false;
        }
        if  (strcmp(argv[i],"-xv")==0) {
            usexv=true;
            save_board(white,"/tmp/board");
            system("dtp -in /tmp/board -out /tmp/board.ppm");
            system("xv -wloop -wait 10 /tmp/board.ppm &");
        }
        if (strcmp(argv[i],"-evaltype")==0) {
            sscanf(argv[++i],"%i",&eval_type);
        }
        if (strcmp(argv[i],"-mycolor")==0) {
            sscanf(argv[++i],"%i",&my_color);
        }
        if (strcmp(argv[i],"-windows")==0) {
            windows=true;
        }
        if (strcmp(argv[i],"-db")==0) {
            read_all_databases(40);
        }
        /*if (strcmp(argv[i],"-mailplay")==0) {
            mailplay(argv[i+1]);
            }*/
        if (strcmp(argv[i],"-quit")==0) {
            exit(0);
        }
        i++;
    }
    if (windows==true) {
        usecol=false;
    }
    if (windows==false) {
        display_board();
    }
    if (windows==true) {
        printf("connecting to windows interface\n");
    } 
    read_all_databases(40);

    do {
        signal(SIGINT,stopprogram);
        /*fflush(stdout);*/
        printf("dragon> ");
        /*fflush(stdout);*/
        
        if (windows==true) {
            in=winGetFile();
        } else {
            in=stdin;
        }
        fscanf(in,"%s",input);
        signal(SIGINT,SIG_DFL);
        if (input[0]=='!') system(&input[1]);
        else if (strcmp(input,"pn")==0) {
            int target;
            fscanf(in,"%i%i%i",&in1,&in2,&target);

            init_tstats();
            do_pn_search(in1,in2,target,1);
            print_stats();
            print_pv();
        }
        else if (strcmp(input,"pn2")==0) {
            int target;
            fscanf(in,"%i%i%i",&in1,&in2,&target);

            init_tstats();
            do_pn_search(in1,in2,target,2);
            print_stats();
            print_pv();
        }
        else if (strcmp(input,"load")==0 || strcmp(input,"get")==0) {
            fscanf(in,"%s",buffer);
            load_board(buffer);
            init_tstats();
            display_board();
        }
        else if (strcmp(input,"setup")==0) {
            /* loads a board position in damexchange format */
            char b[64];
            int i;
            fscanf(in,"%s",b);
            for (i=0;i<50;i++) {
                board[map[i]]=empty;
                if (b[i]=='w') board[map[i]]=white|man;
                if (b[i]=='b') board[map[i]]=black|man;
                if (b[i]=='W') board[map[i]]=white|crown;
                if (b[i]=='B') board[map[i]]=black|crown;
            }
            set_pieces();
            init_tstats();
            init_history();
        }
        else if (strcmp(input,"initboard")==0) {
            init_board();
            display_board();
        }
        else if (strcmp(input,"allowtwoplyincrements")==0) {
            fscanf(in,"%i",&allowTwoPlyIncrements);    
        }
        else if (strcmp(input,"eval")==0) {
            int dummy;
            
            fscanf(in,"%i",&in1);
            init_hash();
            init_stats();
            set_eval();
            dprint("score:%i\n",evalboard(in1,-INF,INF,&dummy));
        }
        else if (strcmp(input,"evalmoves")==0) {
            int m,nmoves;
            int score;
            int dummy;
            
            nmoves=move_list(0,game_color);
            for(m=0;m<nmoves;m++) {
                do_move(movelist[0][m]);
                set_eval();
                score=-evalboard(1-game_color,-INF,INF,&dummy);
                undo_move(movelist[0][m]);
                print_move(movelist[0][m]);
                dprint(": %i\n",score);
            }
        }
        else if (strcmp(input,"mobil")==0) {
            int act,block;
            set_eval();
            dprint("moves:%i\n",mobility_w(board,&act,&block));
            dprint("active:%i\n",act);
            dprint("blocked:%i\n",block);
        }
        else if (strcmp(input,"oneman")==0) {
            fscanf(in,"%i",&in1);
            dprint("score:%i\n",one_man(in1));
        }
        else if (strcmp(input,"tablestats")==0) {
            tablestats();
        }
        else if (strcmp(input,"savetables")==0) {
            save_tables();
        }
        else if (strcmp(input,"make_pat_tree")==0) {
            make_pat_tree();
        }
        else if (strcmp(input,"load_seperate_patterns")==0) {
            fscanf(in,"%i",&in1);
            load_seperate_patterns(in1);
        }
        else if (strcmp(input,"save_bin_patterns")==0) {
            save_bin_patterns();
        }
        else if (strcmp(input,"save_pat_tree")==0) {
            save_pat_tree();
        }
        else if (strcmp(input,"load_pat_tree")==0) {
            load_pat_tree();
        }
        else if (strcmp(input,"booklearn")==0) {
            fscanf(in,"%i",&in1);
            printf("bookroot: %i\n",-bookLearn0(in1));
        }
        else if (strcmp(input,"bookmode")==0) {
            fscanf(in,"%i",&bookMode);
        }
        else if (strcmp(input,"make_bin_book")==0) {
            char name[1024];
            fscanf(in,"%s",name);
            make_bin_book(name);
        }
        else if (strcmp(input,"history")==0) {
            fscanf(in,"%i",&in1);
            show_history(in1);
        }
        else if (strcmp(input,"index")==0) {
            DBINDEX index;
            fscanf(in,"%i",&in1);
            index=database_linear_index(in1);
            if (index<0) { dprint("fatal index: %llu %i\n",index,sizeof(DBINDEX)); display_board();}
            dprint("%llu\n",index);
        }
        else if (strcmp(input,"maxpv")==0) {
            fscanf(in,"%i",&in1);
            if (maxpv>0) maxpv=in1;
            if (maxpv>MPV) maxpv=MPV;
            dprint("mpv set to %i\n",maxpv);
        }
        else if (strcmp(input,"saveboard")==0) {
            char name[100];
            fscanf(in,"%i %s",&in1,name);
            save_board(in1,name);
        }
        else if (strcmp(input,"savefen")==0) {
            char name[100];
            fscanf(in,"%s",name);
            write_pdnFen(name);
        }
        else if (strcmp(input,"write_pdn")==0) {
            char file[256];
            fscanf(in,"%s",file);
            /*dprint("whiteplayer:");
            fscanf(in,"%s",pdn_info.whitepl);
            dprint("blackplayer:");
            fscanf(in,"%s",pdn_info.blackpl);
            dprint("result:");
            fscanf(in,"%s",pdn_info.result);*/
            write_pdn(file);
        }
        else if (strcmp(input,"write_dw")==0) {
            char file[256];
            fscanf(in,"%s",file);
            write_dw(file);
        }
        else if (strcmp(input,"reverse")==0) {
            BTYPE temp[93];
            copy_board(temp,board);
            reverse_board(board,temp);
            display_board();
        }
        else if (strcmp(input,"evaltype")==0) {
            fscanf(in,"%i",&eval_type);
            dprint("eval type=%i\n",eval_type);
        }
        else if (strcmp(input,"control")==0) {
            fscanf(in,"%i",&in1);
            dprint("score:%i\n",field_control(in1));
        }
        else if (strcmp(input,"patternstats")==0) {
            dprint("score:%i\n",print_pattern_stats());
        }
        else if (strcmp(input,"patternsave")==0) {
            save_pattern_stats();
        }
        else if (strcmp(input,"patternload")==0) {
            load_pattern_stats();
        }
        else if (strcmp(input,"pattern")==0) {
            /*fscanf(in,"%i",&in1);*/
            dprint("score:%i\n",handle_pattern(0,board,0));
        }
        else if (strcmp(input,"seed")==0) {
            fscanf(in,"%i",&in1);
            srand(in1);
        }
        else if (strcmp(input,"alfa")==0) {
            fscanf(in,"%i",&alfa);
        }
        else if (strcmp(input,"beta")==0) {
            fscanf(in,"%i",&beta);
        }
        else if (strcmp(input,"stats")==0) {
            print_stats();
        }
        else if (strcmp(input,"bd")==0) {
            display_board();
        }
        else if (strcmp(input,"back")==0) {
            take_back(1);
        }
        else if (strcmp(input,"winhistory")==0) {
            winShowHistory();
        }
        else if (strcmp(input,"timepermove")==0) {
            fscanf(in,"%f",&timeControlTimePerMove);
            timeControlMode=TCM_TIME_PER_MOVE;
        }
        else if (strcmp(input,"timepergame")==0) {
            fscanf(in,"%i %f %i %f %f %f",&timeControlMoves,&timeForFirstControl,&timeControlMoves2,&timeForSecondControl,&time_reserve,&operator_time);
            timeControlMode=TCM_TIME_PER_GAME;
        }
        else if (strcmp(input,"maxply")==0) {
            fscanf(in,"%i",&timeControlMaxPly);
            timeControlMode=TCM_MAXPLY;
        }
        else if (strcmp(input,"countgame")==0) {
            int in1;
            fscanf(in,"%i",&in1);
            countGame(in1);
        }
        else if (strcmp(input,"movescore")==0) {
            int i,n;

            n=move_list(0,0);
            for(i=0;i<n;i++) {
                print_move(movescore[i].move);
                dprint(": %i\n",movescore[i].value);
            }
        }
        else if (strcmp(input,"dopv")==0) {
            fscanf(in,"%i",&in1);
            xstore_history(PV[0][in1],"pv");
            winShowHistory();
            do_move(PV[0][in1]);
            display_board();
        }
        else if (strcmp(input,"mback")==0) {
            fscanf(in,"%i",&in1);
            take_back(in1);
        }
        else if (strcmp(input,"goto")==0) {
            int in1;
            game_color=game_color^((game_history_nr)&1);
            game_history_nr=0;
            fscanf(in,"%i",&in1);
            take_back(-in1);
        }
        else if (strcmp(input,"followpv")==0) {
            fscanf(in,"%i",&in1);
            for(i=0;i<in1;i++) {
                xstore_history(PV[0][i],"pv");
                winShowHistory();
                do_move(PV[0][i]);
            }
            display_board();
        }
        else if (strcmp(input,"plearn")==0) {
            fscanf(in,"%i",&in1);
            plearn(white,in1);
        }
        else if (strcmp(input,"plearn_test")==0) {
            int i,ok;
            char filename[256];
            for(i=0;i<490;i++) {
                sprintf(filename,"wieger/%.3i",i);
                ok=load_board(filename);
                if (ok==false) {
                    dprint("pattern not found\n");
                    break;
                }
                plearn(white,800);
            }
        }
        else if (strcmp(input,"psave")==0) {
            save_tpat();
        }
        else if (strcmp(input,"pstats")==0) {
            tpat_stats();
        }
        else if (strcmp(input,"show_test")==0) {
            double s_e2,s_t2;
            s_e2=(test_e2-test_e*test_e/test_nr)/(test_nr-1)/test_nr;
            s_t2=(test_t2-test_t*test_t/test_nr)/(test_nr-1)/test_nr;

            dprint("%.0lf test done, av. eval=%.0lf, av. time=%.2lf (%.2lf)\n",
                   test_nr,test_e/test_nr,test_t/test_nr);
        }
        else if (strcmp(input,"ab")==0) {
            int score,t,d,exact;
            double cl;
            fscanf(in,"%i%i",&in1,&in2);
            init_stats(); set_eval();
            init_tstats();
            t=-clock();
            init_hash();
            score=alfabeta(alfa,beta,in1,0,in2,0,&exact);
            t+=clock();
            cl=(double) t/CLOCKS_PER_SEC;
            print_pv();
            print_stats();
            test_e+=neval; test_e2+=neval*neval;
            test_t+=cl; test_t2+=cl*cl;
            test_nr+=1;
            dprint("score:%.3f time:%.2f\n",score/1000.0F,(float) t/CLOCKS_PER_SEC);
        }
        else if (strcmp(input,"?")==0) {
            int n;
            n=move_list(0,0);
            dprint("White: "); print_movelist(0,n);
            n=move_list(0,1);
            dprint("Black: "); print_movelist(0,n);
        }
        else if (strcmp(input,"go")==0) {
            fscanf(in,"%i %i",&in1,&in2);
            if (in1==0 || in1==1) play(in1,in2,INF,9);
            else dprint("error\n");
            display_board();
        }
        else if (strcmp(input,"auto")==0) {
            int exact,mat;
            float timepermove;
            fscanf(in,"%i %f",&in1,&timepermove);
            do {
                mat=xmaterial(in1,&exact);
                if (exact==true) {
                    dprint("game ended, score:%i\n",mat);
                    break;
                }
                play(in1,timepermove,INF,9);
                display_board();
                in1=1-in1;
                if (stopflag==true) { break; }
            } while(1==1);
        }

        else if (strcmp(input,"makef")==0) {
            int i;
            for(i=0;i<50;i++) dprint("#define F%i %i\n",i+1,map[i]);
        }
        else if (strcmp(input,"white")==0) {
            my_color=white;
        }
        else if (strcmp(input,"black")==0) {
            my_color=black;
        }
        else if (strcmp(input,"windows")==0) {
            int in1,in2,in3;
            fscanf(in,"%i %i %i",&in1,&in2,&in3);
            dprint("connected to windows interface v%i.%i.%i\n",in1,in2,in3);
        }
        else if (strcmp(input,"databases")==0) {
            fscanf(in,"%i",&in1);
            read_all_databases(in1);
        }
        else if (strcmp(input,"ping")==0) {
            char buffer[64];
            fscanf(in,"%s",buffer);
            dprint("\n");
            dprint("PONG|%s\n",buffer);
        }
        else if (strcmp(input,"blockingplay")==0) {
            fscanf(in,"%i",&blockingPlay);
        }
        else if (strcmp(input,"bteval")==0) {
            int in1;
            fscanf(in,"%i",&in1);
            dprint("%i\n",btEval(in1));
        }
        else if (strcmp(input,"break")==0) {
            generate_breakthrough();
        }
        else if (strcmp(input,"bt")==0) {
            neval=0;
            dprint("bt-value: %i\n",breakthrough(0,0,16));
        }
        else if (strcmp(input,"testpos")==0) {
            readTestPositions();
        }
        else if (strcmp(input,"btb")==0) {
            dprint("btb-value: %i\n",breakthroughBTM(16));
        }
        else if (strcmp(input,"setcomment")==0) {
            char buffer[MAXCOMMENT];
            int in1;
            fscanf(in,"%i %256c",&in1,buffer);  // use of maxcomment
            strcpy(game_history[in1].comment,buffer);
        }
        else if (strcmp(input,"setpdntag")==0) {
            char buffer[100];
            int in1;
            fscanf(in,"%i %100c",&in1,buffer); 
            if (in1==0) strcpy(pdn_info.whitepl,buffer);
            if (in1==1) strcpy(pdn_info.blackpl,buffer);
            if (in1==2) strcpy(pdn_info.result,buffer);
            if (in1==3) strcpy(pdn_info.date,buffer);
            if (in1==4) strcpy(pdn_info.event,buffer);
            if (in1==5) strcpy(pdn_info.site,buffer);
            if (in1==6) strcpy(pdn_info.round,buffer);
        }
        else if (strcmp(input,"play")==0 || strcmp(input,"play1")==0 || strcmp(input,"play2")==0 || strcmp(input,"playstr")==0) {
            /* play from to 
               play1  from to time1 time2
               */
            float at;
            int nmoves;  /* max search time */
            int maxply;  /* max search depth */
            int tm;
            char movestr[100];
            char tmpmove[100];
            char move[MOVEL];
            
            time_t start,end;
            time(&start);

            if (strcmp(input,"play1")==0) {
                fscanf(in,"%i %i %f %f",&in1,&in2,&timeUsed[0],&timeUsed[1]);
                if (in1!=0 || in2!=0) {
                    tm=try_move(game_color,in1,in2);
                    if (tm==0) {
                        display_board();
                        goto play_error;
                    }
                    if (tm>=2) {
                        display_board();
                        dprint("REQUESTMOVE\n");
                        goto play_error;
                    }
                    display_board();
                }

            } else if (strcmp(input,"playstr")==0) {
                int found,nr;
                
                fscanf(in,"%s %f %f",movestr,&timeUsed[0],&timeUsed[1]);
                nmoves=move_list(0,game_color);
                found=0;
                for(nr=0;nr<nmoves;nr++) {
                    sprint_move(tmpmove,movelist[0][nr]);
                    if (strcmp(tmpmove,movestr)==0) {
                        found++;
                        if (found==1) {
                            xstore_history(movelist[0][nr],"");
                            do_move(movelist[0][nr]);
                            display_board();
                        }
                    } 
                }
            } else {
                fscanf(in,"%i %i",&in1,&in2);
                if (in1!=0 || in2!=0) {
                    tm=try_move(game_color,in1,in2);
                    if (tm==0) {
                        display_board();
                        goto play_error;
                    }
                    if (tm>=2) {
                        display_board();
                        dprint("REQUESTMOVE\n");
                        goto play_error;
                    }
                    display_board();
                }

            }
            
            //fclose(in);
            //unlink("com/win.in");
            //in=NULL;
            
            /*if (game_color!=my_color) {
                dprint("Its not my turn\n");
                goto play_error;
            }*/
            
            /* check for game end */
            nmoves=move_list(0,game_color);
            if (nmoves==0) {
                if (game_color==white) {
                    strcpy(pdn_info.result,"0-1");
                }
                if (game_color==black) {
                    strcpy(pdn_info.result,"1-0");
                }
            }
            
            winShowHistory();
            if (nmoves==0) {
                winprint("\n",game_color);
                winprint("DRAGONLOSES|%i\n",game_color);
            }
            
            if (timeControlMode==TCM_TIME_PER_MOVE) {
                at=timeControlTimePerMove;
                maxply=MAXPLY-1;
            } else if (timeControlMode==TCM_TIME_PER_GAME) {
                at=alloc_time(game_color);
                maxply=MAXPLY-1;
            } else if (timeControlMode==TCM_MAXPLY) {
                maxply=timeControlMaxPly;
                at=1E+10;
            }
            
            /*if (nmoves==1) {
                print_move_damExchange(movelist[0][0],0);
            }*/
            
            printf("%f %i\n",at,maxply);
            winprint("\n");
            winprint("PROGRESS|||||*\n");

            play(game_color,at,maxply*100,9);
            display_board();
            time(&end);
            dprint("actual time used:%.2f  t:%f %f\n",difftime(end,start),timeUsed[0],timeUsed[1]);
            /*do {
                nmoves=move_list(0,game_color);
                if (nmoves==1) {
                    dprint("forced move:");
                    print_move(movelist[0][0]);
                    dprint("\n");
                    xstore_history(movelist[0][0],"forced");
                    do_move(movelist[0][0]);
                    display_board();
                }
            } while(nmoves==1);*/
            /*if (nmoves>1) {
                print_move_damExchange(PV[0][0],(int) difftime(end,start));
            }*/
            if (nmoves>0) {
                print_move_damExchange(game_history[game_history_nr-1].move,(int) difftime(end,start));
            }
            printf("moves: %i\n",nmoves);
            if (nmoves==1) {
                winprint("\n");
                winprint("FORCEDMOVE\n");
            }
            
play_error:
        //
        }
        else if (strcmp(input,"set")==0) {
            fscanf(in,"%i %i",&in1,&in2);
            board[map[in1-1]]=in2;
        }
        else if (strcmp(input,"hplus")==0) {
            char nullmove[32]={4,0,0,0,0};
            xstore_history(nullmove,"hplus");
            winShowHistory();
        }
        else if (strcmp(input,"help")==0) {
            dprint("\
                   help                        generate this mesage\n\
                   history {verbose 0,1,2}     show played moves\n\
                   ?                           show available moves\n\
                   go {player}{time}           computer thinks and does a move\n\
                   do {move}                   enter a move\n\
                   analyse {player}{time}      computer thinks\n\
                   bd                          draw board\n\
                   dopv {n}                    do best known move\n\
                   ! {command}                 shell escape\n\
                   eval                        static evaluation\n\
                   movescore                   show score of all moves\n\
                   kill {0,1,2,3}              set killer method\n\
                   bestfit\n\
                   bookmove                    try to do move from book\n\
                   test                        speed tests\n\
                   get {file}                  load position\n\
                   quit                        quit\n\
                   pn {color}{nodes}{type}     do pn1 search\n\
                   selective {boolean}         selective search\n\
                   load {file}                 load position\n\
                   write_pdn {file}            save game\n\
                   saveboard {color}{file}     save position\n\
                   maxpv {n}                   set maxpv\n\
                   followpv {n}                play out pv\n\
                   plearn {plusscore}          learn pattern\n\
                   psave                       save patterns\n\
                   back                        take back\n\
                   mback {n}                   multiple takeback\n\
                   reverse                     reverse black/white\n\
                   timecommand {time white}    set timers\n\
               {time black} {optime}\n\
               {timecontrolply}\n\
                   hplus                       increase history\n\
                   make_pat_tree\n\
                   save_pat_tree\n\
                   load_pat_tree\n\
                   make_bin_book\n\
                   auto {color} {time}         autoplayer\n\
                   initboard                   new board\n");
        }
        else if (strcmp(input,"kill")==0) {
            fscanf(in,"%i",&kill_method);
        }
        else if (strcmp(input,"xray")==0) {
            int in1;
            fscanf(in,"%i",&in1);
            print_xray(in1);
        }
        else if (strcmp(input,"selective")==0) {
            fscanf(in,"%i",&selective);
            if (selective==false) dprint("not selective\n");
            else if (selective==true) dprint("selective search\n");
            else dprint("selective error\n");
        }
        else if (strcmp(input,"bestfit")==0) {
            best_fit();
        }
        else if (strcmp(input,"bookmove")==0) {
            int s;
            int dum;
            fscanf(in,"%i",&in1);
            dprint("bookscore:%i\n",book_score(in1,&dum));
            s=try_book(0,in1);
            display_board();
            dprint("score:%i\n",s);
        }

        else if (strcmp(input,"hist")==0) {
            fscanf(in,"%i %i",&in1,&in2);
            for(i=0;i<150;i++) dprint("%4i ",history[in1][i][in2]);
            dprint("\n");
        }
        else if (strcmp(input,"test")==0) {
            int i,x=1000000,t,n;
            int dummy1,dummy2,dummy3;
            char dummymove[32];
            int dummy;
            
            dprint("Time in microseconds\n");
            t=clock();
            for(i=0;i<x;i++) field_control(0);
            dprint("field_control:  %3.2f\n",1.0E6*(clock()-t)/CLOCKS_PER_SEC/x);

            t=clock();
            for(i=0;i<x;i++) store_hash(0,0,0,0,movelist[0][0]);
            dprint("store_hash:     %3.2f\n",1.0E6*(clock()-t)/CLOCKS_PER_SEC/x);

            t=clock();
            for(i=0;i<x;i++) retreive_hash(0,&dummy1,&dummy2,&dummy3,dummymove);
            dprint("retreive_hash:  %3.2f\n",1.0E6*(clock()-t)/CLOCKS_PER_SEC/x);

            t=clock();
            for(i=0;i<x;i++) theoretic(0);
            dprint("theoretic:      %3.2f\n",1.0E6*(clock()-t)/CLOCKS_PER_SEC/x);

            t=clock();
            for(i=0;i<x;i++) material(0);
            dprint("material:       %3.2f\n",1.0E6*(clock()-t)/CLOCKS_PER_SEC/x);

            t=clock();
            for(i=0;i<x;i++) evalboard(0,-INF,INF,&dummy);
            dprint("evalboard:      %3.2f\n",1.0E6*(clock()-t)/CLOCKS_PER_SEC/x);

            t=clock();
            for(i=0;i<x;i++) n=move_list(0,0);
            dprint("move_list:      %3.2f\n",1.0E6*(clock()-t)/CLOCKS_PER_SEC/x);

            t=clock();
            for(i=0;i<x;i++) do_move(movelist[0][0]);
            dprint("do_move(0):     %3.2f\n",1.0E6*(clock()-t)/CLOCKS_PER_SEC/x);

            t=clock();
            for(i=0;i<x;i++) storemove(0,movelist[0][0]);
            dprint("storemove:      %3.2f\n",1.0E6*(clock()-t)/CLOCKS_PER_SEC/x);

            t=clock();
            for(i=0;i<x;i++) findkiller(0,n);
            dprint("findkiller:     %3.2f\n",1.0E6*(clock()-t)/CLOCKS_PER_SEC/x);

            t=clock();
            for(i=0;i<x;i++) quiet(1);
            dprint("quiet:          %3.2f\n",1.0E6*(clock()-t)/CLOCKS_PER_SEC/x);

            t=clock();
            for(i=0;i<x;i++) database_linear_index(game_color);
            dprint("database index: %3.2f\n",1.0E6*(clock()-t)/CLOCKS_PER_SEC/x);
        }
        else if (strcmp(input,"xedit")==0) {
            char xinput[16];
            int field;
            int piece;
            int color=white;

            for(field=0;field<50;field++) board[map[field]]=empty;
            do {
                fscanf(in,"%s",xinput);

                if (xinput[0]=='.') break;
                else if (xinput[0]=='c') color=black-color;
                else {
                    if (xinput[0]=='P') piece=man;
                    else if (xinput[0]=='K') piece=crown;
                    else dprint("never get here\n");
                    field=xparse(xinput[1],xinput[2]);
                    if (field!=-1) board[map[field-1]]=color|piece;
                }
            } while(1==1);
            display_board();fflush(stdout);
        }
        else if (strcmp(input,"xdomove")==0) {
            char move[32];
            char xmove[8];
            int from,to,r;
            fscanf(in,"%s",xmove);
            if (strcmp(xmove,"null")==0) {
                r=false;
                goto scipmovein;
            }
            from=xparse(xmove[0],xmove[1]);
            to=xparse(xmove[2],xmove[3]);
            r=try_move(game_color,from,to);
            if (r!=0) {
                fflush(stdout);
            }
            if (move_list(0,game_color)==0) { /* it's now my turn */
                dprint("opponent mates!\n");fflush(stdout);
                goto end_xdomove;
            }
scipmovein:
            if (r==false) {
                /* accept move */
                dprint("xsetboard "); xprintboard();
                fflush(stdout);
                play(my_color,alloc_time(game_color),INF,9);
                xprint_move(game_history[game_history_nr-1].move);
                display_board();
                if (move_list(0,game_color)==0) { /* it's now oppy turn */
                    dprint("computer mates!\n");fflush(stdout);
                    goto end_xdomove;
                }
            }
end_xdomove:
        }
        else if (strcmp(input,"time")==0) {
            fscanf(in,"%i",&in1);
            /*dprint("command not supported\n");*/

            fflush(stdout);
        }
        else if (strcmp(input,"otim")==0) {
            fscanf(in,"%i",&in1);
            /*dprint("command not supported\n");*/
            dprint("otim 30000 40 netlag 4302 4302 0\n");
            fflush(stdout);
        }
        else if (strcmp(input,"pc")==0) {
            dprint("%i %i %i %i\n",pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
        }
        else if (strcmp(input,"do")==0) {
            int c,nr,nmoves,found=0;
            char move[32];

            fscanf(in,"%i-%i",&in1,&in2);
            in1=map[in1-1]; in2=map[in2-1];
            for(c=white;c<=black;c++) {
                nmoves=move_list(0,c);
                for(nr=0;nr<nmoves;nr++) {
                    if (in1==movelist[0][nr][1] && in2==movelist[0][nr][movelist[0][nr][0]-1]) {
                        found++;
                        movecopy(move,movelist[0][nr]);
                    }
                }
            }
            if (found==0) dprint("Illegal move\n");
            /*else if (found>1) dprint("Ambigious move\n");*/
            else {
                xstore_history(move,"");
                do_move(move);
                display_board();
                winShowHistory();
                /* check is move allows draw */ /* debugcode */
                init_rephash();
                if (is_repetition(game_color)==true) {
                    dprint("draw by repetition possible\n");
                }

            }
        }
        else if (strcmp(input,"active")==0) {
            int depth,score;
            fscanf(in,"%i%i",&in1,&in2);
            for(depth=200;depth<1200;depth+=200) {
                init_stats();
                init_tstats();
                score=active(in2,in1,0,depth);
                print_pv();
                print_stats();
                dprint("score:%.3f\n",score/1000.0F);
            }
        }
        else if (strcmp(input,"solve")==0) {
            int score,t;
            fscanf(in,"%i%i",&in1,&in2);
            init_stats();
            init_tstats();
            init_hash();
            t=-clock();
            score=solve(-INF,INF,in1,0,in2);
            t+=clock();
            print_pv();
            print_stats();
            dprint("score:%.3f time:%.2f\n",score/1000.0F,(float) t/CLOCKS_PER_SEC);
        }
        else if (strcmp(input,"analyse")==0) {
            int t,time,score,d,exact;
            char temp[32]="";

            fscanf(in,"%i%i",&in1,&in2);
            d=100; time=clock();init_hash();set_eval();
            while((clock()-time)<CLOCKS_PER_SEC*in2) {
                dprint("\ndepth:%.1f\n",d/100.0F);
                init_tstats();
                t=-clock();
                /**/
                movecopy(killer[0],temp);
                score=alfabeta(alfa,beta,in1,0,d,0,&exact);
                movecopy(temp,PV[0][0]);
                t+=clock();
                print_pv();
                print_stats();
                dprint("score:%.3f time:%.2f\n",score/1000.0F,(float) t/CLOCKS_PER_SEC);
                d+=100;
            }
        }
        else if (strcmp(input,"analysepos")==0) {
            int in1;
            fscanf(in,"%f",&in1);
            analysePosition(in1);
        }
        else if (strcmp(input,"anagame")==0) {
            int in1,in2,in4,in5;
            float in3;
            
            fscanf(in,"%i %i %f %i %i",&in1,&in2,&in3,&in4,&in5);
            analyseGame(in1,in2,in3,in4,in5);
        }
        else if (strcmp(input,"+db")==0) use_db=true;
        else if (strcmp(input,"-db")==0) use_db=false;
        else if (strcmp(input,"+order")==0) do_order=true;
        else if (strcmp(input,"-order")==0) do_order=false;
        else if (strcmp(input,"quit")==0) ;
        else if (strcmp(input,"+hash")==0) use_hash=true;
        else if (strcmp(input,"-hash")==0) use_hash=false;
        else if (strcmp(input,"default_search")==0) {
            fscanf(in,"%i",&default_search);
        }
        else if (strcmp(input,"default_eval")==0) {
            fscanf(in,"%i",&default_eval);
        }
        else if (strcmp(input,"usedb")==0) {
            fscanf(in,"%i",&use_db);
        }
        else if (strcmp(input,"learn")==0) {
            int d1,d2,e1,e2;
            fscanf(in,"%i%i%i%i%i",&in1,&d1,&e1,&d2,&e2);
            randomgame(in1,d1,e1,d2,e2,true);
        }
        else if (strcmp(input,"match")==0) {
            int d1,d2,e1,e2;
            fscanf(in,"%i%i%i%i%i",&in1,&d1,&e1,&d2,&e2);
            randomgame(in1,d1,e1,d2,e2,false);
        }
        else if (strcmp(input,"promote")==0) {
            dprint("white promote: %i\n",-has_promote(white));
            dprint("black promote: %i\n",-has_promote(black));
        }
       else if (strcmp(input,"pat")==0) {
            int pat;
            pat=npat_find(game_color,0);
            dprint("%i\n",pat);
            print_move(movelist[0][0]);
            dprint("\n");
        }
       else if (strcmp(input,"quiet")==0) {
            fscanf(in,"%i",&in1);
            dprint("%i\n",quiet(in1));
        }
       else if (strcmp(input,"setcol")==0) {
            fscanf(in,"%i",&in1);
            game_color=in1;
            init_history();
            display_board();
        }
       else if (strcmp(input,"sethash")==0) {
            fscanf(in,"%i",&in1);
            printf("hallo\n");
            setHash(in1);
        }
       else if (strcmp(input,"nextall")==0) {
            int i1,i2,i3,i4;
            fscanf(in,"%i %i %i %i",&i1,&i2,&i3,&i4);
            dprint("%i %i %i\n",nextall[i1][i2][i3][i4],board[nextall[i1][i2][i3][i4]],RBOARD(i1,i2,i3,i4));
        }
       else if (strcmp(input,"setpdn")==0) {
            char buffer[1024];
            char *b;
            fscanf(in,"%1023c",buffer);
            b=buffer;
            b=xread(pdn_info.whitepl,b);
            b=xread(pdn_info.blackpl,b);
            b=xread(pdn_info.site,b);
            b=xread(pdn_info.event,b);
            b=xread(pdn_info.date,b);
            b=xread(pdn_info.round,b);
        }
        else if (strcmp(input,"readwingame")==0) {
            if (read_wingame()==false) {
                winprint("\n");
                winprint("MSGBOX|Unable to read file\n");
            }
        }
        
        else dprint("error\n");
        if (windows==true && in!=NULL) {
            fclose(in);
            unlink("com/win.in2");
        }
        
    } while(strcmp(input,"quit")!=0 && strcmp(input,"q")!=0 && strcmp(input,"exit")!=0);
    #ifdef MAPPEDMEMORY
        mem64_exit();
    #endif

    return(0);
}
#endif
